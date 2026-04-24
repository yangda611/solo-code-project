import { useStore } from '../store';

export function AccountPanel() {
  const { account, connected } = useStore();

  if (!account) {
    return (
      <div className="matrix-panel" style={{ height: '100%' }}>
        <div className="matrix-panel-header">ACCOUNT</div>
        <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5 }}>
          {connected ? 'Loading...' : 'Disconnected'}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const pnlClass = account.totalPnL >= 0 ? 'positive' : 'negative';
  const equityChange = account.equity - account.balance;
  const equityClass = equityChange >= 0 ? 'positive' : 'negative';

  return (
    <div className="matrix-panel" style={{ height: '100%' }}>
      <div className="matrix-panel-header">
        ACCOUNT
        <span style={{ 
          float: 'right',
          color: connected ? 'var(--matrix-green)' : 'var(--matrix-red)'
        }}>
          {connected ? '● ONLINE' : '○ OFFLINE'}
        </span>
      </div>
      
      <div style={{ padding: '12px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            fontSize: '14px'
          }}>
            <span style={{ opacity: 0.7 }}>Balance:</span>
            <span className="matrix-text">${formatNumber(account.balance)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <span style={{ opacity: 0.7 }}>Equity:</span>
            <span className={equityClass}>${formatNumber(account.equity)}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px'
          }}>
            <span style={{ opacity: 0.7 }}>Total PnL:</span>
            <span className={pnlClass}>
              {account.totalPnL >= 0 ? '+' : ''}${formatNumber(account.totalPnL)}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px'
          }}>
            <span style={{ opacity: 0.7 }}>Total Fees:</span>
            <span>${formatNumber(account.totalFees)}</span>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--matrix-border)', 
          paddingTop: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '4px',
              fontSize: '11px'
            }}>
              <span>Margin Usage</span>
              <span>
                ${formatNumber(account.usedMargin)} / ${formatNumber(account.availableMargin + account.usedMargin)}
              </span>
            </div>
            <div style={{ 
              height: '8px', 
              background: 'var(--matrix-gray)',
              border: '1px solid var(--matrix-border)'
            }}>
              <div style={{ 
                height: '100%', 
                background: account.usedMargin / (account.availableMargin + account.usedMargin) > 0.8 
                  ? 'var(--matrix-red)' 
                  : 'var(--matrix-green)',
                width: `${Math.min(100, (account.usedMargin / (account.availableMargin + account.usedMargin)) * 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--matrix-border)', 
          paddingTop: '12px'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '8px' }}>
            POSITIONS ({account.positions.length})
          </div>
          {account.positions.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.5, padding: '16px' }}>
              No open positions
            </div>
          ) : (
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
              {account.positions.map((pos, idx) => (
                <div key={idx} style={{ 
                  padding: '8px', 
                  border: '1px solid var(--matrix-border)',
                  marginBottom: '8px',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className={pos.side === 'long' ? 'positive' : 'negative'}>
                      {pos.side.toUpperCase()} {pos.symbol}
                    </span>
                    <span>x{pos.leverage}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Entry: ${formatNumber(pos.entryPrice)}</span>
                    <span className={pos.unrealizedPnL >= 0 ? 'positive' : 'negative'}>
                      PnL: {pos.unrealizedPnL >= 0 ? '+' : ''}${formatNumber(pos.unrealizedPnL)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span>Size: {formatNumber(pos.quantity, 4)}</span>
                    <span style={{ color: 'var(--matrix-orange)' }}>
                      Liq: ${formatNumber(pos.liquidationPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
