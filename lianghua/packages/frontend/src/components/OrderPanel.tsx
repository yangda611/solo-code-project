import { useState } from 'react';
import { useStore } from '../store';

export function OrderPanel() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState<string>('0.01');
  const [price, setPrice] = useState<string>('');
  const [leverage, setLeverage] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { tick, addLog } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          type: orderType,
          quantity: parseFloat(quantity),
          price: orderType === 'limit' ? parseFloat(price) : undefined,
          leverage: parseInt(leverage),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog(`[ORDER] Submitted: ${result.id}`);
      } else {
        const error = await response.json();
        addLog(`[ERROR] ${error.error}`);
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPrice = tick ? ((tick.bid + tick.ask) / 2).toFixed(2) : '--';

  return (
    <div className="matrix-panel" style={{ height: '100%' }}>
      <div className="matrix-panel-header">TRADE PANEL</div>
      
      <form onSubmit={handleSubmit} style={{ padding: '12px' }}>
        <div style={{ display: 'flex', marginBottom: '12px' }}>
          <button
            type="button"
            className="matrix-button"
            style={{ 
              flex: 1, 
              marginRight: '4px',
              background: side === 'buy' ? 'var(--matrix-green-dark)' : 'transparent',
              borderColor: side === 'buy' ? 'var(--matrix-green)' : 'var(--matrix-border)',
              color: side === 'buy' ? 'var(--matrix-green)' : 'var(--matrix-text-secondary)'
            }}
            onClick={() => setSide('buy')}
          >
            BUY / LONG
          </button>
          <button
            type="button"
            className="matrix-button"
            style={{ 
              flex: 1, 
              marginLeft: '4px',
              background: side === 'sell' ? 'rgba(255, 0, 64, 0.2)' : 'transparent',
              borderColor: side === 'sell' ? 'var(--matrix-red)' : 'var(--matrix-border)',
              color: side === 'sell' ? 'var(--matrix-red)' : 'var(--matrix-text-secondary)'
            }}
            onClick={() => setSide('sell')}
          >
            SELL / SHORT
          </button>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', opacity: 0.7 }}>Order Type</label>
          <div style={{ display: 'flex' }}>
            <label style={{ display: 'flex', alignItems: 'center', marginRight: '16px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderType"
                checked={orderType === 'market'}
                onChange={() => setOrderType('market')}
                style={{ marginRight: '8px' }}
              />
              Market
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderType"
                checked={orderType === 'limit'}
                onChange={() => setOrderType('limit')}
                style={{ marginRight: '8px' }}
              />
              Limit
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', opacity: 0.7 }}>
            Price {orderType === 'market' && <span style={{ fontStyle: 'italic' }}>(Market: {currentPrice})</span>}
          </label>
          <input
            type="number"
            className="matrix-input"
            style={{ width: '100%' }}
            value={orderType === 'limit' ? price : currentPrice}
            onChange={(e) => setPrice(e.target.value)}
            disabled={orderType === 'market'}
            step="0.01"
            placeholder="Enter price..."
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', opacity: 0.7 }}>Quantity (BTC)</label>
          <input
            type="number"
            className="matrix-input"
            style={{ width: '100%' }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            step="0.0001"
            min="0.0001"
            placeholder="Enter quantity..."
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', opacity: 0.7 }}>Leverage (x{leverage})</label>
          <input
            type="range"
            min="1"
            max="100"
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            style={{ width: '100%', accentColor: 'var(--matrix-green)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.5 }}>
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>75x</span>
            <span>100x</span>
          </div>
        </div>

        <button
          type="submit"
          className="matrix-button"
          style={{ 
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            background: side === 'buy' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 0, 64, 0.2)',
            borderColor: side === 'buy' ? 'var(--matrix-green)' : 'var(--matrix-red)',
            color: side === 'buy' ? 'var(--matrix-green)' : 'var(--matrix-red)'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'SUBMITTING...' : `${side === 'buy' ? 'BUY' : 'SELL'} ${quantity} BTC @ x${leverage}`}
        </button>

        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          border: '1px solid var(--matrix-border)',
          fontSize: '10px',
          opacity: 0.7
        }}>
          <div>Est. Cost: ${orderType === 'limit' && price ? (parseFloat(price) * parseFloat(quantity) / parseInt(leverage)).toFixed(2) : '--'}</div>
          <div>Maker Fee: 0.01% | Taker Fee: 0.05%</div>
        </div>
      </form>
    </div>
  );
}
