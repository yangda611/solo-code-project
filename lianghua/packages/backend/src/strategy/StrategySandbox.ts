import { v4 as uuidv4 } from 'uuid';
import { Strategy, Tick, KLine, Position, Order, Account } from '../types';

export interface StrategyContext {
  symbol: string;
  currentTick: Tick | null;
  currentKLine: KLine | null;
  kLineHistory: KLine[];
  positions: Position[];
  openOrders: Order[];
  account: {
    balance: number;
    equity: number;
    availableMargin: number;
    usedMargin: number;
    totalPnL: number;
  };
  timestamp: number;
}

export interface StrategyAPI {
  buy: (quantity: number, price?: number, leverage?: number) => string;
  sell: (quantity: number, price?: number, leverage?: number) => string;
  cancelOrder: (orderId: string) => boolean;
  log: (message: string) => void;
  getIndicator: (name: string, params?: Record<string, number>) => number | null;
}

type StrategyCallback = (ctx: StrategyContext, api: StrategyAPI) => void;

const FORBIDDEN_PATTERNS = [
  /\beval\s*\(/g,
  /\bnew\s+Function\s*\(/g,
  /\bFunction\s*\(/g,
  /\bsetTimeout\s*\(/g,
  /\bsetInterval\s*\(/g,
  /\bsetImmediate\s*\(/g,
  /\bprocess\./g,
  /\brequire\s*\(/g,
  /\bimport\s*\(/g,
  /\b__dirname\b/g,
  /\b__filename\b/g,
  /\bglobal\./g,
  /\bglobalThis\./g,
  /\bwindow\./g,
  /\bdocument\./g,
  /\blocalStorage\./g,
  /\bsessionStorage\./g,
  /\bXMLHttpRequest\b/g,
  /\bfetch\s*\(/g,
  /\bWebSocket\b/g,
  /\bWorker\b/g,
  /\bSharedWorker\b/g,
  /\beval\s*=/g,
  /\bwindow\s*=/g,
];

function validateCode(code: string): { valid: boolean; error?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { 
        valid: false, 
        error: `Forbidden pattern detected: ${pattern.source}` 
      };
    }
  }
  return { valid: true };
}

export class StrategySandbox {
  private strategies: Map<string, Strategy> = new Map();
  private compiledStrategies: Map<string, StrategyCallback> = new Map();
  private logs: Map<string, string[]> = new Map();
  private api: StrategyAPI | null = null;
  private executionTimeLimit: number = 100;

  registerAPI(api: StrategyAPI): void {
    this.api = api;
  }

  addStrategy(name: string, language: 'python' | 'javascript', code: string): Strategy {
    const id = uuidv4();
    const strategy: Strategy = {
      id,
      name,
      language,
      code,
      status: 'idle',
    };

    this.strategies.set(id, strategy);
    this.logs.set(id, []);

    return strategy;
  }

  compileStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;

    try {
      const validation = validateCode(strategy.code);
      if (!validation.valid) {
        strategy.status = 'error';
        strategy.error = validation.error;
        return false;
      }

      if (strategy.language === 'javascript') {
        const compiled = this.compileJavaScript(strategy.code);
        this.compiledStrategies.set(strategyId, compiled);
        strategy.status = 'idle';
        return true;
      } else {
        const compiled = this.compilePython(strategy.code);
        this.compiledStrategies.set(strategyId, compiled);
        strategy.status = 'idle';
        return true;
      }
    } catch (error) {
      strategy.status = 'error';
      strategy.error = error instanceof Error ? error.message : String(error);
      return false;
    }
  }

  private compileJavaScript(code: string): StrategyCallback {
    const wrappedCode = `
      'use strict';
      return function(ctx, api) {
        var Math = Math;
        var Date = Date;
        var JSON = JSON;
        var Number = Number;
        var String = String;
        var Boolean = Boolean;
        var Array = Array;
        var Object = Object;
        var console = { log: api.log };
        
        ${code}
        
        if (typeof onTick === 'function') {
          onTick(ctx, api);
        }
      };
    `;

    const factory = new Function(wrappedCode);
    return factory();
  }

  private compilePython(code: string): StrategyCallback {
    return (ctx: StrategyContext, api: StrategyAPI) => {
      api.log(`Python strategy execution simulated. Code: ${code.substring(0, 100)}...`);
    };
  }

  executeStrategy(strategyId: string, context: StrategyContext): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy || strategy.status === 'error') return;

    const compiled = this.compiledStrategies.get(strategyId);
    if (!compiled) {
      if (!this.compileStrategy(strategyId)) return;
      return this.executeStrategy(strategyId, context);
    }

    const startTime = Date.now();
    
    try {
      const api = this.createSandboxedAPI(strategyId, context);
      
      const proxyContext = this.createProxyContext(context);
      
      compiled(proxyContext, api);
      
      const executionTime = Date.now() - startTime;
      if (executionTime > this.executionTimeLimit) {
        this.addLogEntry(strategyId, `[WARNING] Strategy exceeded execution time limit: ${executionTime}ms`);
      }
      
      strategy.status = 'running';
    } catch (error) {
      strategy.status = 'error';
      strategy.error = error instanceof Error ? error.message : String(error);
      this.addLogEntry(strategyId, `[ERROR] ${strategy.error}`);
    }
  }

  private createProxyContext(context: StrategyContext): StrategyContext {
    const handler = {
      get(target: any, prop: string | symbol) {
        if (typeof prop === 'string' && !['symbol', 'currentTick', 'currentKLine', 'kLineHistory', 'positions', 'openOrders', 'account', 'timestamp'].includes(prop)) {
          return undefined;
        }
        return target[prop];
      },
      set() {
        return false;
      },
    };

    return new Proxy(context, handler);
  }

  private createSandboxedAPI(strategyId: string, context: StrategyContext): StrategyAPI {
    const self = this;
    const baseAPI = this.api;

    return {
      buy: (quantity: number, price?: number, leverage?: number): string => {
        if (typeof quantity !== 'number' || quantity <= 0) {
          self.addLogEntry(strategyId, '[ERROR] Invalid quantity for buy order');
          return '';
        }
        if (leverage !== undefined && (leverage < 1 || leverage > 100)) {
          self.addLogEntry(strategyId, '[ERROR] Invalid leverage (must be 1-100)');
          return '';
        }
        
        self.addLogEntry(strategyId, `[BUY] qty=${quantity}, price=${price ?? 'market'}, leverage=${leverage ?? 1}`);
        if (baseAPI) {
          return baseAPI.buy(quantity, price, leverage);
        }
        return '';
      },
      sell: (quantity: number, price?: number, leverage?: number): string => {
        if (typeof quantity !== 'number' || quantity <= 0) {
          self.addLogEntry(strategyId, '[ERROR] Invalid quantity for sell order');
          return '';
        }
        if (leverage !== undefined && (leverage < 1 || leverage > 100)) {
          self.addLogEntry(strategyId, '[ERROR] Invalid leverage (must be 1-100)');
          return '';
        }
        
        self.addLogEntry(strategyId, `[SELL] qty=${quantity}, price=${price ?? 'market'}, leverage=${leverage ?? 1}`);
        if (baseAPI) {
          return baseAPI.sell(quantity, price, leverage);
        }
        return '';
      },
      cancelOrder: (orderId: string): boolean => {
        if (typeof orderId !== 'string' || !orderId) {
          self.addLogEntry(strategyId, '[ERROR] Invalid order ID');
          return false;
        }
        
        self.addLogEntry(strategyId, `[CANCEL] orderId=${orderId}`);
        if (baseAPI) {
          return baseAPI.cancelOrder(orderId);
        }
        return false;
      },
      log: (message: string): void => {
        self.addLogEntry(strategyId, `[LOG] ${String(message)}`);
        if (baseAPI) {
          baseAPI.log(String(message));
        }
      },
      getIndicator: (name: string, params?: Record<string, number>): number | null => {
        if (typeof name !== 'string' || !name) {
          self.addLogEntry(strategyId, '[ERROR] Invalid indicator name');
          return null;
        }
        
        if (baseAPI) {
          return baseAPI.getIndicator(name, params);
        }
        return null;
      },
    };
  }

  private addLogEntry(strategyId: string, message: string): void {
    const logs = this.logs.get(strategyId);
    if (logs) {
      const timestamp = new Date().toISOString();
      logs.push(`[${timestamp}] ${message}`);
      if (logs.length > 1000) {
        logs.shift();
      }
    }
  }

  getStrategy(strategyId: string): Strategy | undefined {
    return this.strategies.get(strategyId);
  }

  getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  getLogs(strategyId: string): string[] {
    return this.logs.get(strategyId) || [];
  }

  removeStrategy(strategyId: string): boolean {
    this.strategies.delete(strategyId);
    this.compiledStrategies.delete(strategyId);
    this.logs.delete(strategyId);
    return true;
  }

  pauseStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return false;
    strategy.status = 'paused';
    return true;
  }

  resumeStrategy(strategyId: string): boolean {
    const strategy = this.strategies.get(strategyId);
    if (!strategy || strategy.status === 'error') return false;
    strategy.status = 'running';
    return true;
  }
}
