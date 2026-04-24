import { Scenario, ScenarioEvent } from '../types';
import { MarketDataGenerator } from '../market/MarketDataGenerator';
import { eventBus } from '../core/EventBus';

export interface ScenarioConfig {
  name: string;
  type: Scenario['type'];
  description: string;
  duration: number;
  baseVolatility: number;
  events: ScenarioEventTemplate[];
}

interface ScenarioEventTemplate {
  timeOffset: number;
  type: ScenarioEvent['type'];
  parameters: Record<string, number>;
}

const PREDEFINED_SCENARIOS: ScenarioConfig[] = [
  {
    name: '闪崩行情',
    type: 'flash_crash',
    description: '模拟闪电崩盘 - 价格在短时间内急剧下跌',
    duration: 60000,
    baseVolatility: 0.001,
    events: [
      { timeOffset: 5000, type: 'volatility_spike', parameters: { multiplier: 5 } },
      { timeOffset: 10000, type: 'liquidity_drain', parameters: { percent: 0.8 } },
      { timeOffset: 15000, type: 'price_jump', parameters: { percent: -0.15 } },
      { timeOffset: 20000, type: 'price_jump', parameters: { percent: -0.1 } },
      { timeOffset: 30000, type: 'price_jump', parameters: { percent: 0.05 } },
      { timeOffset: 40000, type: 'volatility_spike', parameters: { multiplier: 2 } },
    ],
  },
  {
    name: '黑天鹅事件',
    type: 'black_swan',
    description: '模拟极端黑天鹅事件 - 市场完全失控',
    duration: 120000,
    baseVolatility: 0.002,
    events: [
      { timeOffset: 10000, type: 'market_halt', parameters: { duration: 5000 } },
      { timeOffset: 20000, type: 'price_jump', parameters: { percent: -0.3 } },
      { timeOffset: 30000, type: 'volatility_spike', parameters: { multiplier: 10 } },
      { timeOffset: 45000, type: 'liquidity_drain', parameters: { percent: 0.95 } },
      { timeOffset: 60000, type: 'price_jump', parameters: { percent: -0.2 } },
      { timeOffset: 80000, type: 'price_jump', parameters: { percent: 0.15 } },
      { timeOffset: 100000, type: 'volatility_spike', parameters: { multiplier: 3 } },
    ],
  },
  {
    name: '熔断机制',
    type: 'circuit_breaker',
    description: '模拟市场熔断 - 多次暂停交易',
    duration: 180000,
    baseVolatility: 0.0015,
    events: [
      { timeOffset: 5000, type: 'price_jump', parameters: { percent: -0.07 } },
      { timeOffset: 10000, type: 'market_halt', parameters: { duration: 15000 } },
      { timeOffset: 30000, type: 'price_jump', parameters: { percent: -0.05 } },
      { timeOffset: 40000, type: 'volatility_spike', parameters: { multiplier: 8 } },
      { timeOffset: 50000, type: 'market_halt', parameters: { duration: 30000 } },
      { timeOffset: 90000, type: 'price_jump', parameters: { percent: -0.1 } },
      { timeOffset: 100000, type: 'market_halt', parameters: { duration: 60000 } },
    ],
  },
  {
    name: '正常波动',
    type: 'normal',
    description: '标准市场环境 - 温和波动',
    duration: 300000,
    baseVolatility: 0.0005,
    events: [
      { timeOffset: 30000, type: 'volatility_spike', parameters: { multiplier: 2 } },
      { timeOffset: 60000, type: 'price_jump', parameters: { percent: 0.02 } },
      { timeOffset: 120000, type: 'price_jump', parameters: { percent: -0.015 } },
      { timeOffset: 180000, type: 'volatility_spike', parameters: { multiplier: 1.5 } },
      { timeOffset: 240000, type: 'price_jump', parameters: { percent: 0.03 } },
    ],
  },
];

export class ScenarioManager {
  private scenarios: Map<string, Scenario> = new Map();
  private activeScenario: Scenario | null = null;
  private startTime: number = 0;
  private isRunning: boolean = false;
  private marketGenerator: MarketDataGenerator | null = null;
  private eventTimeout: NodeJS.Timeout | null = null;
  private isHalted: boolean = false;

  constructor() {
    for (const config of PREDEFINED_SCENARIOS) {
      const scenario = this.createScenario(config);
      this.scenarios.set(scenario.id, scenario);
    }
  }

  private createScenario(config: ScenarioConfig): Scenario {
    return {
      id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      type: config.type,
      description: config.description,
      duration: config.duration,
      volatilityMultiplier: config.baseVolatility,
      events: config.events.map((e, index) => ({
        timestamp: e.timeOffset,
        type: e.type,
        parameters: { ...e.parameters, index },
      })),
    };
  }

  registerMarketGenerator(generator: MarketDataGenerator): void {
    this.marketGenerator = generator;
  }

  getScenarios(): Scenario[] {
    return Array.from(this.scenarios.values());
  }

  getScenario(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  startScenario(scenarioId: string): boolean {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario || this.isRunning) return false;

    this.activeScenario = scenario;
    this.startTime = Date.now();
    this.isRunning = true;
    this.isHalted = false;

    if (this.marketGenerator) {
      this.marketGenerator.setVolatility(scenario.volatilityMultiplier);
      if (!this.marketGenerator.isActive()) {
        this.marketGenerator.start();
      }
    }

    this.scheduleNextEvent();
    return true;
  }

  private scheduleNextEvent(): void {
    if (!this.activeScenario || !this.isRunning) return;

    const elapsed = Date.now() - this.startTime;
    const nextEvent = this.activeScenario.events.find(e => e.timestamp > elapsed);

    if (nextEvent) {
      const delay = nextEvent.timestamp - elapsed;
      this.eventTimeout = setTimeout(() => {
        this.executeEvent(nextEvent);
        this.scheduleNextEvent();
      }, delay);
    } else {
      this.stopScenario();
    }
  }

  private executeEvent(event: ScenarioEvent): void {
    eventBus.publish({ type: 'scenario_event', data: event });

    switch (event.type) {
      case 'price_jump':
        this.handlePriceJump(event.parameters);
        break;
      case 'volatility_spike':
        this.handleVolatilitySpike(event.parameters);
        break;
      case 'liquidity_drain':
        this.handleLiquidityDrain(event.parameters);
        break;
      case 'market_halt':
        this.handleMarketHalt(event.parameters);
        break;
    }
  }

  private handlePriceJump(params: Record<string, number>): void {
    const percent = params.percent || 0;
    if (this.marketGenerator) {
      this.marketGenerator.jumpPrice(percent);
    }
  }

  private handleVolatilitySpike(params: Record<string, number>): void {
    const multiplier = params.multiplier || 1;
    if (this.activeScenario && this.marketGenerator) {
      const newVolatility = this.activeScenario.volatilityMultiplier * multiplier;
      this.marketGenerator.setVolatility(newVolatility);
      
      setTimeout(() => {
        if (this.marketGenerator && this.activeScenario) {
          this.marketGenerator.setVolatility(this.activeScenario.volatilityMultiplier);
        }
      }, 5000);
    }
  }

  private handleLiquidityDrain(params: Record<string, number>): void {
    eventBus.publish({
      type: 'scenario_event',
      data: {
        timestamp: Date.now(),
        type: 'liquidity_drain',
        parameters: params,
      },
    });
  }

  private handleMarketHalt(params: Record<string, number>): void {
    const duration = params.duration || 5000;
    this.isHalted = true;

    if (this.marketGenerator) {
      this.marketGenerator.stop();
    }

    setTimeout(() => {
      this.isHalted = false;
      if (this.marketGenerator && this.isRunning) {
        this.marketGenerator.start();
      }
    }, duration);
  }

  stopScenario(): void {
    this.isRunning = false;
    this.activeScenario = null;
    this.isHalted = false;

    if (this.eventTimeout) {
      clearTimeout(this.eventTimeout);
      this.eventTimeout = null;
    }
  }

  isScenarioActive(): boolean {
    return this.isRunning;
  }

  getActiveScenario(): Scenario | null {
    return this.activeScenario;
  }

  getElapsedTime(): number {
    if (!this.isRunning || !this.activeScenario) return 0;
    return Date.now() - this.startTime;
  }

  getProgress(): number {
    if (!this.isRunning || !this.activeScenario) return 0;
    const elapsed = this.getElapsedTime();
    return Math.min(100, (elapsed / this.activeScenario.duration) * 100);
  }
}
