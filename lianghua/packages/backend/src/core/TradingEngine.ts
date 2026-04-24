import { v4 as uuidv4 } from 'uuid';
import { Order, Trade, Position, Account, Tick } from '../types';
import { OrderBook } from './OrderBook';
import { eventBus } from './EventBus';

export interface TradingEngineConfig {
  defaultLeverage: number;
  maxLeverage: number;
  makerFee: number;
  takerFee: number;
  slippageRate: number;
  maintenanceMarginRate: number;
  initialMarginRate: number;
}

const DEFAULT_CONFIG: TradingEngineConfig = {
  defaultLeverage: 1,
  maxLeverage: 100,
  makerFee: 0.0001,
  takerFee: 0.0005,
  slippageRate: 0.0001,
  maintenanceMarginRate: 0.005,
  initialMarginRate: 0.01,
};

export class TradingEngine {
  private config: TradingEngineConfig;
  private orderBooks: Map<string, OrderBook> = new Map();
  private accounts: Map<string, Account> = new Map();
  private currentTick: Map<string, Tick> = new Map();

  constructor(config: Partial<TradingEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  createAccount(initialBalance: number = 100000): Account {
    const id = uuidv4();
    const account: Account = {
      id,
      balance: initialBalance,
      equity: initialBalance,
      usedMargin: 0,
      availableMargin: initialBalance,
      totalPnL: 0,
      totalFees: 0,
      positions: new Map(),
      openOrders: new Map(),
      tradeHistory: [],
    };
    this.accounts.set(id, account);
    return account;
  }

  getAccount(accountId: string): Account | undefined {
    return this.accounts.get(accountId);
  }

  registerSymbol(symbol: string, orderBook: OrderBook): void {
    this.orderBooks.set(symbol, orderBook);
  }

  updateTick(tick: Tick): void {
    this.currentTick.set(tick.symbol, tick);
    
    const orderBook = this.orderBooks.get(tick.symbol);
    if (orderBook) {
      orderBook.updateFromTick(tick);
    }

    this.checkLiquidations(tick.symbol);
    this.updateAccountEquity(tick.symbol);
  }

  submitOrder(accountId: string, orderParams: Omit<Order, 'id' | 'filledQuantity' | 'status' | 'timestamp'>): Order {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const orderBook = this.orderBooks.get(orderParams.symbol);
    if (!orderBook) {
      throw new Error(`Order book not found for symbol: ${orderParams.symbol}`);
    }

    const leverage = Math.min(orderParams.leverage || this.config.defaultLeverage, this.config.maxLeverage);
    const order: Order = {
      id: uuidv4(),
      ...orderParams,
      leverage,
      filledQuantity: 0,
      status: 'pending',
      timestamp: Date.now(),
    };

    const marginCheck = this.checkMargin(account, order);
    if (!marginCheck.valid) {
      order.status = 'rejected';
      throw new Error(marginCheck.reason || 'Margin check failed');
    }

    order.status = 'open';
    account.openOrders.set(order.id, order);

    const trades = orderBook.addOrder(order);
    
    for (const trade of trades) {
      this.processTrade(account, trade, order);
    }

    if (order.filledQuantity === order.quantity) {
      order.status = 'filled';
      account.openOrders.delete(order.id);
    } else if (order.filledQuantity > 0) {
      order.status = 'partial';
    }

    eventBus.publish({ type: 'order_update', data: order });
    this.updateAccountMetrics(account);

    return order;
  }

  private checkMargin(account: Account, order: Order): { valid: boolean; reason?: string } {
    const tick = this.currentTick.get(order.symbol);
    if (!tick) {
      return { valid: false, reason: 'Market data not available - please wait for price feed' };
    }

    const price = order.type === 'market' 
      ? (order.side === 'buy' ? tick.ask : tick.bid)
      : (order.price || (order.side === 'buy' ? tick.ask : tick.bid));

    const notionalValue = price * order.quantity;
    const requiredMargin = notionalValue / order.leverage;
    const fees = notionalValue * this.config.takerFee;
    const totalRequired = requiredMargin + fees;

    if (account.availableMargin < totalRequired) {
      return { 
        valid: false, 
        reason: `Insufficient margin. Required: $${totalRequired.toFixed(2)}, Available: $${account.availableMargin.toFixed(2)}` 
      };
    }

    return { valid: true };
  }

  private processTrade(account: Account, trade: Trade, order: Order): void {
    const tick = this.currentTick.get(trade.symbol);
    if (!tick) return;

    const midPrice = (tick.bid + tick.ask) / 2;
    const slippage = Math.abs(trade.price - midPrice) / midPrice * this.config.slippageRate;
    const actualPrice = trade.side === 'buy' 
      ? trade.price * (1 + slippage)
      : trade.price * (1 - slippage);

    const fee = actualPrice * trade.quantity * this.config.takerFee;
    trade.fee = fee;
    trade.slippage = slippage;
    trade.price = actualPrice;

    order.filledQuantity += trade.quantity;

    account.totalFees += fee;
    account.tradeHistory.push(trade);

    this.updatePosition(account, trade);

    eventBus.publish({ type: 'trade', data: trade });
  }

  private updatePosition(account: Account, trade: Trade): void {
    const positionKey = `${trade.symbol}:${trade.side === 'buy' ? 'long' : 'short'}`;
    const existingPosition = account.positions.get(positionKey);

    if (existingPosition) {
      const totalQuantity = existingPosition.quantity + trade.quantity;
      const avgPrice = (
        existingPosition.entryPrice * existingPosition.quantity + 
        trade.price * trade.quantity
      ) / totalQuantity;

      existingPosition.quantity = totalQuantity;
      existingPosition.entryPrice = avgPrice;
      existingPosition.margin = (avgPrice * totalQuantity) / trade.leverage;
      existingPosition.liquidationPrice = this.calculateLiquidationPrice(
        trade.side === 'buy' ? 'long' : 'short',
        avgPrice,
        trade.leverage
      );

      account.positions.set(positionKey, existingPosition);
    } else {
      const position: Position = {
        symbol: trade.symbol,
        side: trade.side === 'buy' ? 'long' : 'short',
        entryPrice: trade.price,
        quantity: trade.quantity,
        leverage: trade.leverage,
        margin: (trade.price * trade.quantity) / trade.leverage,
        unrealizedPnL: 0,
        realizedPnL: 0,
        liquidationPrice: this.calculateLiquidationPrice(
          trade.side === 'buy' ? 'long' : 'short',
          trade.price,
          trade.leverage
        ),
        timestamp: Date.now(),
      };
      account.positions.set(positionKey, position);
    }

    const oppositeKey = `${trade.symbol}:${trade.side === 'buy' ? 'short' : 'long'}`;
    const oppositePosition = account.positions.get(oppositeKey);
    if (oppositePosition) {
      const closeQuantity = Math.min(trade.quantity, oppositePosition.quantity);
      const pnl = this.calculatePnL(
        oppositePosition.side,
        oppositePosition.entryPrice,
        trade.price,
        closeQuantity
      );
      oppositePosition.realizedPnL += pnl;
      account.totalPnL += pnl;
      account.balance += pnl;

      if (closeQuantity === oppositePosition.quantity) {
        account.positions.delete(oppositeKey);
      } else {
        oppositePosition.quantity -= closeQuantity;
        account.positions.set(oppositeKey, oppositePosition);
      }
    }

    eventBus.publish({ type: 'position_update', data: account.positions.get(positionKey)! });
  }

  private calculateLiquidationPrice(side: 'long' | 'short', entryPrice: number, leverage: number): number {
    const maintenanceMargin = this.config.maintenanceMarginRate;
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }
  }

  private calculatePnL(side: 'long' | 'short', entryPrice: number, exitPrice: number, quantity: number): number {
    if (side === 'long') {
      return (exitPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - exitPrice) * quantity;
    }
  }

  private checkLiquidations(symbol: string): void {
    const tick = this.currentTick.get(symbol);
    if (!tick) return;

    for (const account of this.accounts.values()) {
      const positionsToLiquidate: string[] = [];

      for (const [key, position] of account.positions.entries()) {
        if (position.symbol !== symbol) continue;

        const markPrice = (tick.bid + tick.ask) / 2;
        const shouldLiquidate = position.side === 'long'
          ? markPrice <= position.liquidationPrice
          : markPrice >= position.liquidationPrice;

        if (shouldLiquidate) {
          positionsToLiquidate.push(key);
        }
      }

      for (const key of positionsToLiquidate) {
        this.liquidatePosition(account, key, tick);
      }
    }
  }

  private liquidatePosition(account: Account, positionKey: string, tick: Tick): void {
    const position = account.positions.get(positionKey);
    if (!position) return;

    const liquidationPrice = position.side === 'long' ? tick.bid : tick.ask;
    const pnl = this.calculatePnL(
      position.side,
      position.entryPrice,
      liquidationPrice,
      position.quantity
    );

    const liquidationFee = liquidationPrice * position.quantity * 0.01;
    account.balance += pnl - liquidationFee;
    account.totalPnL += pnl;
    account.totalFees += liquidationFee;

    account.positions.delete(positionKey);

    eventBus.publish({
      type: 'scenario_event',
      data: {
        timestamp: Date.now(),
        type: 'price_jump',
        parameters: {
          liquidation: 1,
          quantity: position.quantity,
        },
      },
    });
  }

  private updateAccountEquity(symbol: string): void {
    const tick = this.currentTick.get(symbol);
    if (!tick) return;

    for (const account of this.accounts.values()) {
      let totalUnrealizedPnL = 0;
      let usedMargin = 0;

      for (const position of account.positions.values()) {
        if (position.symbol !== symbol) continue;

        const markPrice = (tick.bid + tick.ask) / 2;
        position.unrealizedPnL = this.calculatePnL(
          position.side,
          position.entryPrice,
          markPrice,
          position.quantity
        );
        totalUnrealizedPnL += position.unrealizedPnL;
        usedMargin += position.margin;
      }

      account.equity = account.balance + totalUnrealizedPnL;
      account.usedMargin = usedMargin;
      account.availableMargin = account.equity - usedMargin;

      eventBus.publish({
        type: 'account_update',
        data: {
          equity: account.equity,
          availableMargin: account.availableMargin,
          usedMargin: account.usedMargin,
          totalPnL: account.totalPnL,
        },
      });
    }
  }

  private updateAccountMetrics(account: Account): void {
    let usedMargin = 0;
    for (const position of account.positions.values()) {
      usedMargin += position.margin;
    }
    account.usedMargin = usedMargin;
    account.availableMargin = account.equity - usedMargin;
  }

  cancelOrder(accountId: string, orderId: string): Order | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;

    const order = account.openOrders.get(orderId);
    if (!order) return null;

    const orderBook = this.orderBooks.get(order.symbol);
    if (!orderBook) return null;

    const cancelledOrder = orderBook.cancelOrder(orderId);
    if (cancelledOrder) {
      account.openOrders.delete(orderId);
      eventBus.publish({ type: 'order_update', data: cancelledOrder });
      return cancelledOrder;
    }

    return null;
  }

  getOrderBook(symbol: string, depth: number = 10) {
    const orderBook = this.orderBooks.get(symbol);
    return orderBook?.getOrderBook(depth) || { bids: [], asks: [] };
  }

  getConfig(): TradingEngineConfig {
    return { ...this.config };
  }
}
