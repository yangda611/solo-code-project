import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import { TradingEngine, OrderBook } from './core/index.js';
import { MarketDataGenerator, KLineAggregator, TechnicalIndicators } from './market/index.js';
import { StrategySandbox } from './strategy/index.js';
import type { StrategyContext, StrategyAPI } from './strategy/index.js';
import { ScenarioManager } from './scenario/index.js';
import { PerformanceAnalyzer } from './analysis/index.js';
import { eventBus } from './core/EventBus.js';
import type { Tick, KLine, Trade, Order, Position, MarketDataEvent } from './types/index.js';

const fastify = Fastify({ logger: true });

const SYMBOL = 'BTC/USDT';
const INITIAL_BALANCE = 100000;

const tradingEngine = new TradingEngine({
  defaultLeverage: 1,
  maxLeverage: 100,
  makerFee: 0.0001,
  takerFee: 0.0005,
  slippageRate: 0.0001,
  maintenanceMarginRate: 0.005,
  initialMarginRate: 0.01,
});

const orderBook = new OrderBook(SYMBOL);
tradingEngine.registerSymbol(SYMBOL, orderBook);

const marketGenerator = new MarketDataGenerator({
  symbol: SYMBOL,
  basePrice: 50000,
  volatility: 0.001,
  tickInterval: 100,
  spread: 10,
  volumeRange: [10, 100],
});

const klineAggregator = new KLineAggregator(SYMBOL, ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h', '1d']);

const strategySandbox = new StrategySandbox();

const scenarioManager = new ScenarioManager();
scenarioManager.registerMarketGenerator(marketGenerator);

const account = tradingEngine.createAccount(INITIAL_BALANCE);
const performanceAnalyzer = new PerformanceAnalyzer(INITIAL_BALANCE);

const wsClients: Set<any> = new Set();

eventBus.subscribeAll((event: MarketDataEvent) => {
  for (const client of wsClients) {
    try {
      client.socket.send(JSON.stringify(event));
    } catch (e) {
      wsClients.delete(client);
    }
  }
});

eventBus.subscribe('tick', (event) => {
  const tick = event.data as Tick;
  tradingEngine.updateTick(tick);
  klineAggregator.processTick(tick);

  const context: StrategyContext = {
    symbol: SYMBOL,
    currentTick: tick,
    currentKLine: klineAggregator.getCurrentKLine('1m'),
    kLineHistory: klineAggregator.getKLineHistory('1m', 100),
    positions: Array.from(account.positions.values()),
    openOrders: Array.from(account.openOrders.values()),
    account: {
      balance: account.balance,
      equity: account.equity,
      availableMargin: account.availableMargin,
      usedMargin: account.usedMargin,
      totalPnL: account.totalPnL,
    },
    timestamp: tick.timestamp,
  };

  for (const strategy of strategySandbox.getAllStrategies()) {
    if (strategy.status === 'running') {
      strategySandbox.executeStrategy(strategy.id, context);
    }
  }

  if (Math.random() < 0.01) {
    performanceAnalyzer.recordSnapshot(
      tick.timestamp,
      account.balance,
      account.equity,
      Array.from(account.positions.values())
    );
  }
});

eventBus.subscribe('trade', (event) => {
  const trade = event.data as Trade;
  account.tradeHistory.push(trade);
  performanceAnalyzer.recordTrade(trade);
});

const strategyAPI: StrategyAPI = {
  buy: (quantity: number, price?: number, leverage?: number): string => {
    const order = tradingEngine.submitOrder(account.id, {
      symbol: SYMBOL,
      side: 'buy',
      type: price ? 'limit' : 'market',
      price,
      quantity,
      leverage: leverage || 1,
    });
    return order.id;
  },
  sell: (quantity: number, price?: number, leverage?: number): string => {
    const order = tradingEngine.submitOrder(account.id, {
      symbol: SYMBOL,
      side: 'sell',
      type: price ? 'limit' : 'market',
      price,
      quantity,
      leverage: leverage || 1,
    });
    return order.id;
  },
  cancelOrder: (orderId: string): boolean => {
    const result = tradingEngine.cancelOrder(account.id, orderId);
    return result !== null;
  },
  log: (message: string): void => {
    fastify.log.info(`[Strategy] ${message}`);
  },
  getIndicator: (name: string, params?: Record<string, number>): number | null => {
    const klines = klineAggregator.getKLineHistory('1m', 100);
    if (klines.length === 0) return null;

    const lastKline = klines[klines.length - 1];

    switch (name.toLowerCase()) {
      case 'rsi': {
        const period = params?.period || 14;
        const rsi = TechnicalIndicators.RSI(klines, period);
        const last = rsi[rsi.length - 1];
        return isNaN(last.rsi) ? null : last.rsi;
      }
      case 'macd': {
        const macd = TechnicalIndicators.MACD(klines);
        const last = macd[macd.length - 1];
        return isNaN(last.macd) ? null : last.macd;
      }
      case 'bollinger': {
        const period = params?.period || 20;
        const stdDev = params?.stdDev || 2;
        const boll = TechnicalIndicators.BOLL(klines, period, stdDev);
        const last = boll[boll.length - 1];
        return isNaN(last.middle) ? null : last.middle;
      }
      case 'sma': {
        const period = params?.period || 20;
        const prices = klines.map((k: KLine) => k.close);
        const sma = TechnicalIndicators.SMA(prices, period);
        const last = sma[sma.length - 1];
        return isNaN(last) ? null : last;
      }
      case 'ema': {
        const period = params?.period || 20;
        const prices = klines.map((k: KLine) => k.close);
        const ema = TechnicalIndicators.EMA(prices, period);
        const last = ema[ema.length - 1];
        return isNaN(last) ? null : last;
      }
      default:
        return null;
    }
  },
};

strategySandbox.registerAPI(strategyAPI);

async function main() {
  await fastify.register(cors, { origin: true });
  await fastify.register(websocketPlugin);

  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      wsClients.add(connection);

      connection.socket.on('close', () => {
        wsClients.delete(connection);
      });

      connection.socket.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          handleWebSocketMessage(data, connection);
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          fastify.log.error(`WebSocket message error: ${errorMessage}`);
        }
      });
    });
  });

  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: Date.now() };
  });

  fastify.get('/api/account', async () => {
    return {
      id: account.id,
      balance: account.balance,
      equity: account.equity,
      availableMargin: account.availableMargin,
      usedMargin: account.usedMargin,
      totalPnL: account.totalPnL,
      totalFees: account.totalFees,
      positions: Array.from(account.positions.values()),
      openOrders: Array.from(account.openOrders.values()),
    };
  });

  fastify.get('/api/klines/:interval', async (request, reply) => {
    const { interval } = request.params as { interval: string };
    const { count = '500' } = request.query as { count?: string };
    
    const validIntervals = ['1s', '5s', '15s', '1m', '5m', '15m', '1h', '4h', '1d'];
    if (!validIntervals.includes(interval)) {
      return reply.status(400).send({ error: 'Invalid interval' });
    }

    const klines = klineAggregator.getKLineHistory(interval as any, parseInt(count));
    return klines;
  });

  fastify.get('/api/orderbook', async (request) => {
    const { depth = '20' } = request.query as { depth?: string };
    return tradingEngine.getOrderBook(SYMBOL, parseInt(depth));
  });

  fastify.post('/api/orders', async (request, reply) => {
    const body = request.body as {
      side: 'buy' | 'sell';
      type: 'market' | 'limit';
      quantity: number;
      price?: number;
      leverage?: number;
    };

    try {
      const order = tradingEngine.submitOrder(account.id, {
        symbol: SYMBOL,
        side: body.side,
        type: body.type,
        price: body.price,
        quantity: body.quantity,
        leverage: body.leverage || 1,
      });
      return order;
    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  fastify.delete('/api/orders/:orderId', async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const result = tradingEngine.cancelOrder(account.id, orderId);
    
    if (result) {
      return result;
    }
    return reply.status(404).send({ error: 'Order not found' });
  });

  fastify.get('/api/strategies', async () => {
    return strategySandbox.getAllStrategies();
  });

  fastify.post('/api/strategies', async (request) => {
    const body = request.body as {
      name: string;
      language: 'python' | 'javascript';
      code: string;
    };

    const strategy = strategySandbox.addStrategy(body.name, body.language, body.code);
    strategySandbox.compileStrategy(strategy.id);
    return strategy;
  });

  fastify.post('/api/strategies/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string };
    const strategy = strategySandbox.getStrategy(id);
    
    if (!strategy) {
      return reply.status(404).send({ error: 'Strategy not found' });
    }

    strategySandbox.resumeStrategy(id);
    return { status: 'started', strategy };
  });

  fastify.post('/api/strategies/:id/stop', async (request, reply) => {
    const { id } = request.params as { id: string };
    const strategy = strategySandbox.getStrategy(id);
    
    if (!strategy) {
      return reply.status(404).send({ error: 'Strategy not found' });
    }

    strategySandbox.pauseStrategy(id);
    return { status: 'stopped', strategy };
  });

  fastify.get('/api/strategies/:id/logs', async (request, reply) => {
    const { id } = request.params as { id: string };
    const logs = strategySandbox.getLogs(id);
    
    if (!logs) {
      return reply.status(404).send({ error: 'Strategy not found' });
    }

    return logs;
  });

  fastify.get('/api/scenarios', async () => {
    return scenarioManager.getScenarios();
  });

  fastify.post('/api/scenarios/:id/start', async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = scenarioManager.startScenario(id);
    
    if (!success) {
      return reply.status(400).send({ error: 'Failed to start scenario' });
    }

    return { status: 'started', scenario: scenarioManager.getActiveScenario() };
  });

  fastify.post('/api/scenarios/stop', async () => {
    scenarioManager.stopScenario();
    return { status: 'stopped' };
  });

  fastify.get('/api/scenarios/status', async () => {
    return {
      active: scenarioManager.isScenarioActive(),
      scenario: scenarioManager.getActiveScenario(),
      progress: scenarioManager.getProgress(),
      elapsed: scenarioManager.getElapsedTime(),
    };
  });

  fastify.get('/api/performance', async () => {
    return {
      metrics: performanceAnalyzer.getMetrics(),
      pnlHistory: performanceAnalyzer.getPnLHistory(),
      drawdownHistory: performanceAnalyzer.getDrawdownHistory(),
      radarMetrics: performanceAnalyzer.getRadarMetrics(),
    };
  });

  fastify.post('/api/market/start', async () => {
    marketGenerator.start();
    return { status: 'started' };
  });

  fastify.post('/api/market/stop', async () => {
    marketGenerator.stop();
    return { status: 'stopped' };
  });

  fastify.post('/api/reset', async () => {
    marketGenerator.stop();
    scenarioManager.stopScenario();
    account.balance = INITIAL_BALANCE;
    account.equity = INITIAL_BALANCE;
    account.usedMargin = 0;
    account.availableMargin = INITIAL_BALANCE;
    account.totalPnL = 0;
    account.totalFees = 0;
    account.positions.clear();
    account.openOrders.clear();
    account.tradeHistory = [];
    performanceAnalyzer.reset();
    
    return { status: 'reset' };
  });

  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://localhost:8080`);
    
    marketGenerator.start();
    fastify.log.info('Market data generator started');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

function handleWebSocketMessage(data: any, connection: any) {
  switch (data.type) {
    case 'subscribe':
      fastify.log.info('Client subscribed to updates');
      break;
    case 'ping':
      connection.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      fastify.log.warn('Unknown WebSocket message type:', data.type);
  }
}

main();
