export interface Tick {
  timestamp: number;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
  symbol: string;
}

export interface KLine {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  interval: KLineInterval;
}

export type KLineInterval = '1s' | '5s' | '15s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop';
  price?: number;
  stopPrice?: number;
  quantity: number;
  filledQuantity: number;
  status: 'pending' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
  timestamp: number;
  leverage: number;
  clientId?: string;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
  fee: number;
  slippage: number;
  leverage: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  leverage: number;
  margin: number;
  unrealizedPnL: number;
  realizedPnL: number;
  liquidationPrice: number;
  timestamp: number;
}

export interface Account {
  id: string;
  balance: number;
  equity: number;
  usedMargin: number;
  availableMargin: number;
  totalPnL: number;
  totalFees: number;
  positions: Map<string, Position>;
  openOrders: Map<string, Order>;
  tradeHistory: Trade[];
}

export interface Strategy {
  id: string;
  name: string;
  language: 'python' | 'javascript';
  code: string;
  status: 'idle' | 'running' | 'paused' | 'error';
  error?: string;
}

export interface Scenario {
  id: string;
  name: string;
  type: 'normal' | 'flash_crash' | 'black_swan' | 'circuit_breaker';
  description: string;
  duration: number;
  volatilityMultiplier: number;
  events: ScenarioEvent[];
}

export interface ScenarioEvent {
  timestamp: number;
  type: 'price_jump' | 'volatility_spike' | 'liquidity_drain' | 'market_halt';
  parameters: Record<string, number>;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  totalVolume: number;
}

export interface PnLHistoryEntry {
  timestamp: number;
  balance: number;
  equity: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface DrawdownEntry {
  timestamp: number;
  drawdown: number;
  peak: number;
}

export interface IndicatorValue {
  timestamp: number;
  [key: string]: number | undefined;
}

export interface MACDResult extends IndicatorValue {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BOLLResult extends IndicatorValue {
  upper: number;
  middle: number;
  lower: number;
}

export interface RSResult extends IndicatorValue {
  rsi: number;
}

export type MarketDataEvent = 
  | { type: 'tick'; data: Tick }
  | { type: 'kline'; data: KLine }
  | { type: 'trade'; data: Trade }
  | { type: 'order_update'; data: Order }
  | { type: 'position_update'; data: Position }
  | { type: 'account_update'; data: Partial<Account> }
  | { type: 'scenario_event'; data: ScenarioEvent };
