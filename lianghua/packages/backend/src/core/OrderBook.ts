import { v4 as uuidv4 } from 'uuid';
import { Order, Trade, Tick } from '../types';

interface PriceLevel {
  price: number;
  quantity: number;
  orders: Map<string, Order>;
}

export class OrderBook {
  private bids: Map<number, PriceLevel> = new Map();
  private asks: Map<number, PriceLevel> = new Map();
  private bestBid: number = 0;
  private bestAsk: number = Infinity;
  private symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getBestBid(): number {
    return this.bestBid;
  }

  getBestAsk(): number {
    return this.bestAsk;
  }

  getSpread(): number {
    if (this.bestBid === 0 || this.bestAsk === Infinity) return 0;
    return this.bestAsk - this.bestBid;
  }

  addOrder(order: Order): Trade[] {
    const trades: Trade[] = [];
    
    if (order.type === 'market') {
      trades.push(...this.matchMarketOrder(order));
    } else {
      trades.push(...this.matchLimitOrder(order));
      if (order.status === 'open' || order.status === 'partial') {
        this.addToBook(order);
      }
    }

    return trades;
  }

  private matchMarketOrder(order: Order): Trade[] {
    const trades: Trade[] = [];
    const remainingQuantity = order.quantity - order.filledQuantity;

    if (order.side === 'buy') {
      const sortedAsks = Array.from(this.asks.keys()).sort((a, b) => a - b);
      for (const price of sortedAsks) {
        if (trades.reduce((sum, t) => sum + t.quantity, 0) >= remainingQuantity) break;
        const level = this.asks.get(price)!;
        const matchQuantity = Math.min(
          remainingQuantity - trades.reduce((sum, t) => sum + t.quantity, 0),
          level.quantity
        );
        if (matchQuantity > 0) {
          trades.push(this.createTrade(order, price, matchQuantity));
          this.reduceLevel(this.asks, price, matchQuantity);
        }
      }
    } else {
      const sortedBids = Array.from(this.bids.keys()).sort((a, b) => b - a);
      for (const price of sortedBids) {
        if (trades.reduce((sum, t) => sum + t.quantity, 0) >= remainingQuantity) break;
        const level = this.bids.get(price)!;
        const matchQuantity = Math.min(
          remainingQuantity - trades.reduce((sum, t) => sum + t.quantity, 0),
          level.quantity
        );
        if (matchQuantity > 0) {
          trades.push(this.createTrade(order, price, matchQuantity));
          this.reduceLevel(this.bids, price, matchQuantity);
        }
      }
    }

    return trades;
  }

  private matchLimitOrder(order: Order): Trade[] {
    if (!order.price) return [];
    
    const trades: Trade[] = [];
    const remainingQuantity = order.quantity - order.filledQuantity;

    if (order.side === 'buy') {
      const sortedAsks = Array.from(this.asks.keys())
        .filter(p => p <= order.price!)
        .sort((a, b) => a - b);
      
      for (const price of sortedAsks) {
        if (trades.reduce((sum, t) => sum + t.quantity, 0) >= remainingQuantity) break;
        const level = this.asks.get(price)!;
        const matchQuantity = Math.min(
          remainingQuantity - trades.reduce((sum, t) => sum + t.quantity, 0),
          level.quantity
        );
        if (matchQuantity > 0) {
          trades.push(this.createTrade(order, price, matchQuantity));
          this.reduceLevel(this.asks, price, matchQuantity);
        }
      }
    } else {
      const sortedBids = Array.from(this.bids.keys())
        .filter(p => p >= order.price!)
        .sort((a, b) => b - a);
      
      for (const price of sortedBids) {
        if (trades.reduce((sum, t) => sum + t.quantity, 0) >= remainingQuantity) break;
        const level = this.bids.get(price)!;
        const matchQuantity = Math.min(
          remainingQuantity - trades.reduce((sum, t) => sum + t.quantity, 0),
          level.quantity
        );
        if (matchQuantity > 0) {
          trades.push(this.createTrade(order, price, matchQuantity));
          this.reduceLevel(this.bids, price, matchQuantity);
        }
      }
    }

    return trades;
  }

  private addToBook(order: Order): void {
    if (!order.price) return;

    const book = order.side === 'buy' ? this.bids : this.asks;
    const price = order.price;

    if (!book.has(price)) {
      book.set(price, {
        price,
        quantity: 0,
        orders: new Map()
      });
    }

    const level = book.get(price)!;
    const remainingQuantity = order.quantity - order.filledQuantity;
    level.quantity += remainingQuantity;
    level.orders.set(order.id, order);

    if (order.side === 'buy' && price > this.bestBid) {
      this.bestBid = price;
    } else if (order.side === 'sell' && price < this.bestAsk) {
      this.bestAsk = price;
    }
  }

  private reduceLevel(book: Map<number, PriceLevel>, price: number, quantity: number): void {
    const level = book.get(price);
    if (!level) return;

    level.quantity -= quantity;
    if (level.quantity <= 0) {
      book.delete(price);
      this.updateBestPrices(book);
    }
  }

  private updateBestPrices(book: Map<number, PriceLevel>): void {
    if (book === this.bids) {
      const prices = Array.from(this.bids.keys());
      this.bestBid = prices.length > 0 ? Math.max(...prices) : 0;
    } else {
      const prices = Array.from(this.asks.keys());
      this.bestAsk = prices.length > 0 ? Math.min(...prices) : Infinity;
    }
  }

  private createTrade(order: Order, price: number, quantity: number): Trade {
    return {
      id: uuidv4(),
      orderId: order.id,
      symbol: this.symbol,
      side: order.side,
      price,
      quantity,
      timestamp: Date.now(),
      fee: 0,
      slippage: 0,
      leverage: order.leverage
    };
  }

  cancelOrder(orderId: string): Order | null {
    for (const level of this.bids.values()) {
      const order = level.orders.get(orderId);
      if (order) {
        level.orders.delete(orderId);
        level.quantity -= (order.quantity - order.filledQuantity);
        if (level.quantity <= 0) {
          this.bids.delete(level.price);
          this.updateBestPrices(this.bids);
        }
        return { ...order, status: 'cancelled' };
      }
    }
    
    for (const level of this.asks.values()) {
      const order = level.orders.get(orderId);
      if (order) {
        level.orders.delete(orderId);
        level.quantity -= (order.quantity - order.filledQuantity);
        if (level.quantity <= 0) {
          this.asks.delete(level.price);
          this.updateBestPrices(this.asks);
        }
        return { ...order, status: 'cancelled' };
      }
    }
    
    return null;
  }

  getOrderBook(depth: number = 10): { bids: [number, number][]; asks: [number, number][] } {
    const bidPrices = Array.from(this.bids.keys()).sort((a, b) => b - a).slice(0, depth);
    const askPrices = Array.from(this.asks.keys()).sort((a, b) => a - b).slice(0, depth);

    return {
      bids: bidPrices.map(p => [p, this.bids.get(p)!.quantity]),
      asks: askPrices.map(p => [p, this.asks.get(p)!.quantity])
    };
  }

  updateFromTick(tick: Tick): void {
    if (tick.symbol !== this.symbol) return;

    if (tick.bid > 0 && tick.bid < this.bestAsk) {
      this.bestBid = tick.bid;
    }
    if (tick.ask > 0 && tick.ask > this.bestBid) {
      this.bestAsk = tick.ask;
    }
  }
}
