import { useStore } from '../store';

export function LogPanel() {
  const { logs } = useStore();

  return (
    <div className="matrix-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="matrix-panel-header">
        SYSTEM LOGS
        <span style={{ float: 'right', opacity: 0.7 }}>
          {logs.length} entries
        </span>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        background: 'rgba(0, 0, 0, 0.9)',
        lineHeight: '1.6'
      }}>
        {logs.length === 0 ? (
          <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>
            No log entries yet...
          </div>
        ) : (
          logs.slice(-200).map((log, idx) => (
            <div 
              key={idx} 
              style={{ 
                marginBottom: '2px',
                color: log.includes('[ERROR]') ? 'var(--matrix-red)' :
                       log.includes('[WARNING]') ? 'var(--matrix-yellow)' :
                       log.includes('[TRADE]') ? 'var(--matrix-cyan)' :
                       log.includes('[SCENARIO]') ? 'var(--matrix-purple)' :
                       log.includes('[ORDER]') ? 'var(--matrix-orange)' :
                       'var(--matrix-text)',
                opacity: log.includes('[SYSTEM]') ? 0.6 : 1
              }}
            >
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
