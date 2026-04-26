import { create } from 'zustand';
import type { 
  Tick, KLine, Order, Position, Trade, Strategy, Scenario, 
  PerformanceMetrics, PnLHistoryEntry, DrawdownEntry 
} from '../../../backend/src/types';

export interface AppState {
  connected: boolean;
  tick: Tick | null;
  kline: KLine | null;
  klineHistory: KLine[];
  orderBook: { bids: [number, number][]; asks: [number, number][] };
  account: {
    id: string;
    balance: number;
    equity: number;
    availableMargin: number;
    usedMargin: number;
    totalPnL: number;
    totalFees: number;
    positions: Position[];
    openOrders: Order[];
  } | null;
  strategies: Strategy[];
  scenarios: Scenario[];
  activeScenario: Scenario | null;
  scenarioProgress: number;
  performance: {
    metrics: PerformanceMetrics | null;
    pnlHistory: PnLHistoryEntry[];
    drawdownHistory: DrawdownEntry[];
    radarMetrics: { category: string; value: number; max: number }[];
  };
  selectedInterval: string;
  logs: string[];
  
  setConnected: (connected: boolean) => void;
  setTick: (tick: Tick) => void;
  setKline: (kline: KLine) => void;
  setKlineHistory: (history: KLine[]) => void;
  setOrderBook: (orderBook: { bids: [number, number][]; asks: [number, number][] }) => void;
  setAccount: (account: AppState['account'] | ((prev: AppState['account']) => AppState['account'])) => void;
  setStrategies: (strategies: Strategy[]) => void;
  setScenarios: (scenarios: Scenario[]) => void;
  setActiveScenario: (scenario: Scenario | null) => void;
  setScenarioProgress: (progress: number) => void;
  setPerformance: (performance: AppState['performance']) => void;
  setSelectedInterval: (interval: string) => void;
  addLog: (log: string) => void;
  addTrade: (trade: Trade) => void;
  addPosition: (position: Position) => void;
  updateOrder: (order: Order) => void;
}

const initialAccount = {
  id: '',
  balance: 100000,
  equity: 100000,
  availableMargin: 100000,
  usedMargin: 0,
  totalPnL: 0,
  totalFees: 0,
  positions: [],
  openOrders: [],
};

const initialPerformance = {
  metrics: null,
  pnlHistory: [],
  drawdownHistory: [],
  radarMetrics: [],
};

export const useStore = create<AppState>((set) => ({
  connected: false,
  tick: null,
  kline: null,
  klineHistory: [],
  orderBook: { bids: [], asks: [] },
  account: initialAccount,
  strategies: [],
  scenarios: [],
  activeScenario: null,
  scenarioProgress: 0,
  performance: initialPerformance,
  selectedInterval: '1m',
  logs: [],

  setConnected: (connected) => set({ connected }),
  setTick: (tick) => set({ tick }),
  setKline: (kline) => set((state) => {
    if (kline.interval !== state.selectedInterval) {
      return { kline };
    }
    
    const existingIndex = state.klineHistory.findIndex(k => k.timestamp === kline.timestamp);
    let newHistory;
    
    if (existingIndex >= 0) {
      newHistory = [...state.klineHistory];
      newHistory[existingIndex] = kline;
    } else {
      newHistory = [...state.klineHistory.slice(-499), kline];
    }
    
    return { kline, klineHistory: newHistory };
  }),
  setKlineHistory: (history) => set({ klineHistory: history }),
  setOrderBook: (orderBook) => set({ orderBook }),
  setAccount: (account) => set((state) => ({ 
    account: typeof account === 'function' ? account(state.account) : account 
  })),
  setStrategies: (strategies) => set({ strategies }),
  setScenarios: (scenarios) => set({ scenarios }),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setScenarioProgress: (progress) => set({ scenarioProgress: progress }),
  setPerformance: (performance) => set({ performance }),
  setSelectedInterval: (interval) => set({ selectedInterval: interval }),
  addLog: (log) => set((state) => ({
    logs: [...state.logs.slice(-999), log],
  })),
  addTrade: (trade) => set((state) => ({
    account: state.account ? {
      ...state.account,
      tradeHistory: [...(state.account as any).tradeHistory || [], trade],
    } : null,
  })),
  addPosition: (position) => set((state) => {
    if (!state.account) return state;
    const positions = new Map(state.account.positions.map(p => [`${p.symbol}:${p.side}`, p]));
    positions.set(`${position.symbol}:${position.side}`, position);
    return {
      account: {
        ...state.account,
        positions: Array.from(positions.values()),
      },
    };
  }),
  updateOrder: (order) => set((state) => {
    if (!state.account) return state;
    const openOrders = state.account.openOrders.filter(o => o.id !== order.id);
    if (order.status === 'open' || order.status === 'partial') {
      openOrders.push(order);
    }
    return {
      account: {
        ...state.account,
        openOrders,
      },
    };
  }),
}));
