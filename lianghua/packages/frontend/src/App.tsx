import { useState, useEffect } from 'react';
import { useStore } from './store';
import { useWebSocket } from './hooks/useWebSocket';
import {
  KLineChart,
  OrderBook,
  AccountPanel,
  OrderPanel,
  StrategyEditor,
  ScenarioSelector,
  PerformanceCharts,
  LogPanel,
} from './components';

type Tab = 'trading' | 'strategy' | 'scenario' | 'performance';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('trading');
  const [klineInterval, setKlineInterval] = useState('1m');
  const { tick, setKlineHistory, setSelectedInterval, addLog, setOrderBook, setAccount } = useStore();
  
  useWebSocket();

  useEffect(() => {
    loadInitialData();
  }, [klineInterval]);

  const loadInitialData = async () => {
    try {
      const [klinesResponse, orderBookResponse, accountResponse] = await Promise.all([
        fetch(`/api/klines/${klineInterval}?count=500`),
        fetch('/api/orderbook?depth=20'),
        fetch('/api/account'),
      ]);

      if (klinesResponse.ok) {
        const klines = await klinesResponse.json();
        setKlineHistory(klines);
        setSelectedInterval(klineInterval);
      }

      if (orderBookResponse.ok) {
        const orderBook = await orderBookResponse.json();
        setOrderBook(orderBook);
      }

      if (accountResponse.ok) {
        const account = await accountResponse.json();
        setAccount(account);
      }

      addLog('[SYSTEM] Initial data loaded');
    } catch (err: any) {
      addLog(`[ERROR] Failed to load initial data: ${err.message}`);
    }
  };

  const intervals = ['1s', '1m', '5m', '15m', '1h', '4h', '1d'];
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'trading', label: 'TRADING', icon: '📈' },
    { id: 'strategy', label: 'STRATEGY', icon: '🧠' },
    { id: 'scenario', label: 'SCENARIO', icon: '⚡' },
    { id: 'performance', label: 'PERFORMANCE', icon: '📊' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw',
      background: '#000',
      overflow: 'hidden'
    }}>
      <Header 
        tick={tick}
        klineInterval={klineInterval}
        setKlineInterval={setKlineInterval}
        intervals={intervals}
      />

      <TabBar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'trading' && (
          <TradingView />
        )}
        {activeTab === 'strategy' && (
          <StrategyView />
        )}
        {activeTab === 'scenario' && (
          <ScenarioView />
        )}
        {activeTab === 'performance' && (
          <PerformanceView />
        )}
      </div>

      <StatusBar tick={tick} />
    </div>
  );
}

function Header({ 
  tick, 
  klineInterval, 
  setKlineInterval, 
  intervals 
}: {
  tick: any;
  klineInterval: string;
  setKlineInterval: (interval: string) => void;
  intervals: string[];
}) {
  const midPrice = tick ? ((tick.bid + tick.ask) / 2).toFixed(2) : '--';
  const priceChange = tick ? 0 : 0;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '8px 16px',
      background: 'linear-gradient(180deg, #003b00 0%, #000 100%)',
      borderBottom: '1px solid #003b00',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          fontFamily: '"Courier New", monospace',
          textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41'
        }}>
          <span style={{ color: '#00ff41' }}>LIANGHUA</span>
          <span style={{ color: '#008b23', fontSize: '12px', marginLeft: '8px' }}>TRADE v1.0</span>
        </div>

        <div style={{ 
          padding: '4px 16px',
          border: '1px solid #003b00',
          background: 'rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '2px' }}>BTC/USDT</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <span className="matrix-text-glow">${midPrice}</span>
            <span style={{ 
              fontSize: '12px', 
              marginLeft: '8px',
              color: priceChange >= 0 ? '#00ff41' : '#ff0040'
            }}>
              {priceChange >= 0 ? '+' : ''}{(priceChange * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {tick && (
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div>
              <span style={{ opacity: 0.5 }}>BID: </span>
              <span className="positive">${tick.bid.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ opacity: 0.5 }}>ASK: </span>
              <span className="negative">${tick.ask.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ opacity: 0.5 }}>SPREAD: </span>
              <span>${(tick.ask - tick.bid).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>INTERVAL:</span>
        {intervals.map((interval) => (
          <button
            key={interval}
            className="matrix-button"
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              background: klineInterval === interval ? 'rgba(0, 255, 65, 0.2)' : 'transparent',
              borderColor: klineInterval === interval ? '#00ff41' : '#003b00',
            }}
            onClick={() => setKlineInterval(interval)}
          >
            {interval.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function TabBar({ 
  activeTab, 
  setActiveTab, 
  tabs 
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  tabs: { id: Tab; label: string; icon: string }[];
}) {
  return (
    <div style={{ 
      display: 'flex',
      background: '#000',
      borderBottom: '1px solid #003b00',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="matrix-button"
          style={{
            padding: '10px 24px',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid #00ff41' : '2px solid transparent',
            background: activeTab === tab.id ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
            color: activeTab === tab.id ? '#00ff41' : '#008b23',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
          onClick={() => setActiveTab(tab.id)}
        >
          <span style={{ marginRight: '8px' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TradingView() {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '300px 1fr 300px',
      gridTemplateRows: '1fr 200px',
      gap: '8px',
      padding: '8px',
      height: '100%',
    }}>
      <div style={{ gridRow: 'span 2' }}>
        <OrderBook />
      </div>
      
      <div style={{ gridColumn: '2' }}>
        <KLineChart />
      </div>
      
      <div style={{ gridRow: 'span 2' }}>
        <div style={{ height: 'calc(50% - 4px)', marginBottom: '8px' }}>
          <AccountPanel />
        </div>
        <div style={{ height: 'calc(50% - 4px)' }}>
          <OrderPanel />
        </div>
      </div>
      
      <div style={{ gridColumn: '2', height: '100%' }}>
        <LogPanel />
      </div>
    </div>
  );
}

function StrategyView() {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      padding: '8px',
      height: '100%',
    }}>
      <div>
        <StrategyEditor />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <ScenarioSelector />
        </div>
      </div>
    </div>
  );
}

function ScenarioView() {
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      padding: '8px',
      height: '100%',
    }}>
      <div>
        <ScenarioSelector />
      </div>
      <div>
        <LogPanel />
      </div>
    </div>
  );
}

function PerformanceView() {
  return (
    <div style={{ 
      padding: '8px',
      height: '100%',
    }}>
      <PerformanceCharts />
    </div>
  );
}

function StatusBar({ tick }: { tick: any }) {
  const { connected } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 16px',
      background: 'linear-gradient(0deg, #003b00 0%, #000 100%)',
      borderTop: '1px solid #003b00',
      fontSize: '11px',
      fontFamily: 'monospace',
    }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        <span>
          <span style={{ opacity: 0.5 }}>STATUS: </span>
          <span style={{ color: connected ? '#00ff41' : '#ff0040' }}>
            {connected ? '● CONNECTED' : '○ DISCONNECTED'}
          </span>
        </span>
        <span>
          <span style={{ opacity: 0.5 }}>MODE: </span>
          <span className="warning">SIMULATION</span>
        </span>
        <span>
          <span style={{ opacity: 0.5 }}>LEVERAGE: </span>
          <span>1x - 100x</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <span className="blink">
          {tick ? (
            <span style={{ color: '#00ff41' }}>◆ LIVE</span>
          ) : (
            <span style={{ opacity: 0.5 }}>◇ IDLE</span>
          )}
        </span>
        <span style={{ opacity: 0.7 }}>
          {time.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
