import { useState, useEffect } from 'react';
import { useStore } from '../store';
import type { Scenario } from '../../../backend/src/types';

const SCENARIO_ICONS: Record<string, string> = {
  normal: '📊',
  flash_crash: '⚡',
  black_swan: '🦢',
  circuit_breaker: '🚨',
};

const SCENARIO_COLORS: Record<string, string> = {
  normal: 'var(--matrix-green)',
  flash_crash: 'var(--matrix-yellow)',
  black_swan: 'var(--matrix-red)',
  circuit_breaker: 'var(--matrix-orange)',
};

export function ScenarioSelector() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [, setLoading] = useState(false);
  const { activeScenario, scenarioProgress, addLog, setActiveScenario, setScenarioProgress } = useStore();

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    if (activeScenario) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/scenarios/status');
          if (response.ok) {
            const data = await response.json();
            setScenarioProgress(data.progress);
            if (!data.active) {
              setActiveScenario(null);
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Failed to check scenario status:', err);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeScenario, setScenarioProgress, setActiveScenario]);

  const loadScenarios = async () => {
    try {
      const response = await fetch('/api/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const handleStart = async (scenarioId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scenarios/${scenarioId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`[SCENARIO] Started: ${data.scenario?.name}`);
        setActiveScenario(data.scenario);
        setScenarioProgress(0);
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/scenarios/stop', {
        method: 'POST',
      });

      if (response.ok) {
        addLog('[SCENARIO] Stopped');
        setActiveScenario(null);
        setScenarioProgress(0);
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const handleStartMarket = async () => {
    try {
      await fetch('/api/market/start', { method: 'POST' });
      addLog('[MARKET] Market data generator started');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const handleStopMarket = async () => {
    try {
      await fetch('/api/market/stop', { method: 'POST' });
      addLog('[MARKET] Market data generator stopped');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data?')) {
      try {
        await fetch('/api/reset', { method: 'POST' });
        addLog('[SYSTEM] System reset complete');
        setActiveScenario(null);
        setScenarioProgress(0);
      } catch (err: any) {
        addLog(`[ERROR] ${err.message}`);
      }
    }
  };

  return (
    <div className="matrix-panel" style={{ height: '100%' }}>
      <div className="matrix-panel-header">
        SCENARIO CHALLENGES
        {activeScenario && (
          <span style={{ float: 'right' }}>
            <span className="blink">● </span>
            {activeScenario.name} - {scenarioProgress.toFixed(1)}%
          </span>
        )}
      </div>
      
      <div style={{ padding: '12px' }}>
        {activeScenario && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            border: `2px solid ${SCENARIO_COLORS[activeScenario.type]}`,
            background: `${SCENARIO_COLORS[activeScenario.type]}15`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>
                {SCENARIO_ICONS[activeScenario.type]} {activeScenario.name}
              </span>
              <button 
                className="matrix-button" 
                onClick={handleStop}
                style={{ padding: '4px 12px' }}
              >
                STOP
              </button>
            </div>
            <div style={{ height: '6px', background: 'var(--matrix-gray)', border: '1px solid var(--matrix-border)' }}>
              <div style={{ 
                height: '100%', 
                background: SCENARIO_COLORS[activeScenario.type],
                width: `${scenarioProgress}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
              {activeScenario.description}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px' }}>Available Challenges</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {scenarios.map((scenario) => (
              <div 
                key={scenario.id}
                style={{ 
                  padding: '12px',
                  border: `1px solid ${SCENARIO_COLORS[scenario.type]}`,
                  background: activeScenario?.id === scenario.id ? `${SCENARIO_COLORS[scenario.type]}20` : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => !activeScenario && handleStart(scenario.id)}
              >
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  marginBottom: '4px',
                  color: SCENARIO_COLORS[scenario.type]
                }}>
                  {SCENARIO_ICONS[scenario.type]} {scenario.name}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
                  {scenario.description}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.5 }}>
                  Duration: {(scenario.duration / 1000).toFixed(0)}s | Volatility: x{scenario.volatilityMultiplier}
                </div>
                <div style={{ fontSize: '10px', marginTop: '4px' }}>
                  Events: {scenario.events.length}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--matrix-border)', 
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px' }}>Quick Controls</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              className="matrix-button"
              onClick={handleStartMarket}
              style={{ padding: '10px' }}
            >
              ▶ START MARKET
            </button>
            <button 
              className="matrix-button"
              onClick={handleStopMarket}
              style={{ padding: '10px', borderColor: 'var(--matrix-yellow)', color: 'var(--matrix-yellow)' }}
            >
              ⏸ STOP MARKET
            </button>
            <button 
              className="matrix-button"
              onClick={handleReset}
              style={{ 
                gridColumn: 'span 2', 
                padding: '10px',
                borderColor: 'var(--matrix-red)',
                color: 'var(--matrix-red)'
              }}
            >
              ⟲ RESET ALL DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
