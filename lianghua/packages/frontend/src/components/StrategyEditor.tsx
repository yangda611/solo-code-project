import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Strategy } from '../../../backend/src/types';

const DEFAULT_STRATEGY_CODE = `// 示例策略: 简单移动平均线交叉策略
// onTick 函数会在每个Tick数据到达时执行

function onTick(ctx, api) {
  // 获取最新的K线数据
  const klines = ctx.kLineHistory;
  if (klines.length < 50) return; // 等待足够的数据

  // 计算技术指标
  const rsi = api.getIndicator('rsi', { period: 14 });
  const macd = api.getIndicator('macd');
  
  // 简单的RSI策略示例
  if (rsi !== null) {
    api.log('RSI: ' + rsi.toFixed(2));
    
    // RSI超卖时买入
    if (rsi < 30 && ctx.positions.length === 0) {
      api.log('RSI oversold, buying...');
      api.buy(0.01, undefined, 5); // 市价买入0.01 BTC, 5倍杠杆
    }
    
    // RSI超买时卖出
    if (rsi > 70 && ctx.positions.length > 0) {
      api.log('RSI overbought, selling...');
      api.sell(0.01, undefined, 5); // 市价卖出0.01 BTC
    }
  }
}
`;

export function StrategyEditor() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'python' | 'javascript'>('javascript');
  const [code, setCode] = useState(DEFAULT_STRATEGY_CODE);
  const [logs, setLogs] = useState<string[]>([]);
  const { addLog } = useStore();

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await fetch('/api/strategies');
      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      addLog('[ERROR] Strategy name is required');
      return;
    }

    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          language,
          code,
        }),
      });

      if (response.ok) {
        addLog(`[STRATEGY] Created: ${name}`);
        setName('');
        loadStrategies();
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const handleStart = async (strategyId: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        addLog(`[STRATEGY] Started: ${strategyId}`);
        loadStrategies();
        loadLogs(strategyId);
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const handleStop = async (strategyId: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        addLog(`[STRATEGY] Stopped: ${strategyId}`);
        loadStrategies();
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const loadLogs = async (strategyId: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
        setSelectedStrategy(strategyId);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  return (
    <div className="matrix-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="matrix-panel-header">STRATEGY EDITOR</div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="matrix-input"
            style={{ flex: 1, minWidth: '150px' }}
            placeholder="Strategy name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="matrix-input"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript')}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <button className="matrix-button" onClick={handleCreate}>
            CREATE
          </button>
        </div>

        <div style={{ flex: 1, minHeight: '200px' }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
            Strategy Code (onTick function will be called on each tick)
          </div>
          <textarea
            className="matrix-input"
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '150px',
              fontFamily: 'monospace',
              fontSize: '11px',
              resize: 'vertical'
            }}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', minHeight: '150px' }}>
          <div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px' }}>
              Active Strategies ({strategies.length})
            </div>
            <div style={{ 
              height: '120px', 
              overflow: 'auto',
              border: '1px solid var(--matrix-border)'
            }}>
              {strategies.length === 0 ? (
                <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5 }}>
                  No strategies
                </div>
              ) : (
                strategies.map((strategy) => (
                  <div 
                    key={strategy.id} 
                    style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid var(--matrix-border)',
                      fontSize: '11px',
                      background: selectedStrategy === strategy.id ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => loadLogs(strategy.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{strategy.name}</span>
                      <span style={{ 
                        color: strategy.status === 'running' ? 'var(--matrix-green)' : 
                               strategy.status === 'error' ? 'var(--matrix-red)' : 
                               'var(--matrix-text-secondary)'
                      }}>
                        {strategy.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span style={{ opacity: 0.5 }}>{strategy.language}</span>
                      {strategy.status === 'running' ? (
                        <button 
                          className="matrix-button" 
                          style={{ padding: '2px 8px', fontSize: '10px' }}
                          onClick={(e) => { e.stopPropagation(); handleStop(strategy.id); }}
                        >
                          STOP
                        </button>
                      ) : (
                        <button 
                          className="matrix-button" 
                          style={{ padding: '2px 8px', fontSize: '10px' }}
                          onClick={(e) => { e.stopPropagation(); handleStart(strategy.id); }}
                        >
                          START
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px' }}>
              Strategy Logs
            </div>
            <div style={{ 
              height: '120px', 
              overflow: 'auto',
              border: '1px solid var(--matrix-border)',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '10px',
              background: 'rgba(0, 0, 0, 0.8)'
            }}>
              {logs.length === 0 ? (
                <div style={{ opacity: 0.5 }}>Select a strategy to view logs</div>
              ) : (
                logs.slice(-50).map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
