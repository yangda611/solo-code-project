import { Tick, KLine, KLineInterval } from '../types';
import { eventBus } from '../core/EventBus';

export interface MarketDataGeneratorConfig {
  symbol: string;
  basePrice: number;
  volatility: number;
  tickInterval: number;
  spread: number;
  volumeRange: [number, number];
}

const DEFAULT_CONFIG: MarketDataGeneratorConfig = {
  symbol: 'BTC/USDT',
  basePrice: 50000,
  volatility: 0.001,
  tickInterval: 100,
  spread: 10,
  volumeRange: [10, 100],
};

export class MarketDataGenerator {
  private config: MarketDataGeneratorConfig;
  private currentPrice: number;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastTickTimestamp: number = 0;
  private drift: number = 0;

  constructor(config: Partial<MarketDataGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentPrice = this.config.basePrice;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTimestamp = Date.now();
    this.generateTick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateTick(): void {
    if (!this.isRunning) return;

    const now = Date.now();
    const timeDiff = now - this.lastTickTimestamp;
    this.lastTickTimestamp = now;

    const randomWalk = this.generateRandomWalk(timeDiff);
    this.currentPrice += randomWalk;

    const bid = this.currentPrice - this.config.spread / 2;
    const ask = this.currentPrice + this.config.spread / 2;
    const [minVol, maxVol] = this.config.volumeRange;
    const bidVolume = minVol + Math.random() * (maxVol - minVol);
    const askVolume = minVol + Math.random() * (maxVol - minVol);

    const tick: Tick = {
      timestamp: now,
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
      bidVolume: Math.round(bidVolume * 100) / 100,
      askVolume: Math.round(askVolume * 100) / 100,
      symbol: this.config.symbol,
    };

    eventBus.publish({ type: 'tick', data: tick });

    const nextDelay = this.config.tickInterval + (Math.random() - 0.5) * this.config.tickInterval * 0.2;
    this.intervalId = setTimeout(() => this.generateTick(), nextDelay);
  }

  private generateRandomWalk(timeDiff: number): number {
    const dt = timeDiff / 1000;
    const sqrtDt = Math.sqrt(dt);
    
    const meanReversion = -this.drift * 0.01 * dt;
    const randomComponent = (Math.random() - 0.5) * 2 * this.config.volatility * this.currentPrice * sqrtDt;
    const trendComponent = this.drift * dt;

    this.drift = this.drift * 0.99 + (Math.random() - 0.5) * 0.0001;

    return meanReversion + randomComponent + trendComponent;
  }

  setVolatility(volatility: number): void {
    this.config.volatility = volatility;
  }

  setDrift(drift: number): void {
    this.drift = drift;
  }

  jumpPrice(percent: number): void {
    this.currentPrice *= (1 + percent);
  }

  setPrice(price: number): void {
    this.currentPrice = price;
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
