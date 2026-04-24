import { Tick, KLine, KLineInterval } from '../types';
import { eventBus } from '../core/EventBus';

const INTERVAL_MS: Record<KLineInterval, number> = {
  '1s': 1000,
  '5s': 5000,
  '15s': 15000,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '1h': 3600000,
  '4h': 14400000,
  '1d': 86400000,
};

export class KLineAggregator {
  private symbol: string;
  private intervals: KLineInterval[];
  private currentKLines: Map<KLineInterval, KLine | null> = new Map();
  private kLineHistory: Map<KLineInterval, KLine[]> = new Map();
  private maxHistorySize: number;

  constructor(
    symbol: string,
    intervals: KLineInterval[] = ['1s', '1m', '5m', '15m', '1h'],
    maxHistorySize: number = 10000
  ) {
    this.symbol = symbol;
    this.intervals = intervals;
    this.maxHistorySize = maxHistorySize;

    for (const interval of intervals) {
      this.currentKLines.set(interval, null);
      this.kLineHistory.set(interval, []);
    }
  }

  processTick(tick: Tick): void {
    if (tick.symbol !== this.symbol) return;

    const price = (tick.bid + tick.ask) / 2;
    const volume = (tick.bidVolume + tick.askVolume) / 2;

    for (const interval of this.intervals) {
      this.aggregateTick(interval, tick.timestamp, price, volume);
    }
  }

  private aggregateTick(
    interval: KLineInterval,
    timestamp: number,
    price: number,
    volume: number
  ): void {
    const intervalMs = INTERVAL_MS[interval];
    const candleOpenTime = Math.floor(timestamp / intervalMs) * intervalMs;

    let current = this.currentKLines.get(interval);

    if (!current || current.timestamp !== candleOpenTime) {
      if (current) {
        this.finalizeCandle(interval, current);
      }

      current = {
        timestamp: candleOpenTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
        symbol: this.symbol,
        interval,
      };
      this.currentKLines.set(interval, current);
    } else {
      current.high = Math.max(current.high, price);
      current.low = Math.min(current.low, price);
      current.close = price;
      current.volume += volume;
    }
  }

  private finalizeCandle(interval: KLineInterval, candle: KLine): void {
    const history = this.kLineHistory.get(interval);
    if (history) {
      history.push({ ...candle });
      if (history.length > this.maxHistorySize) {
        history.shift();
      }
    }
    eventBus.publish({ type: 'kline', data: { ...candle } });
  }

  getCurrentKLine(interval: KLineInterval): KLine | null {
    return this.currentKLines.get(interval) || null;
  }

  getKLineHistory(interval: KLineInterval, count: number = 100): KLine[] {
    const history = this.kLineHistory.get(interval);
    if (!history) return [];

    const current = this.currentKLines.get(interval);
    const result = [...history.slice(-count)];
    if (current && result.length < count) {
      result.push({ ...current });
    }

    return result;
  }

  getSymbol(): string {
    return this.symbol;
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
  }
}
