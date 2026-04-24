import { useStore } from '../store';

interface OrderBookProps {
  depth?: number;
}

export function OrderBook({ depth = 10 }: OrderBookProps) {
  const { orderBook, tick } = useStore();

  const formatPrice = (price: number) => price.toFixed(2);
  const formatVolume = (volume: number) => volume.toFixed(4);

  const bids = orderBook.bids.slice(0, depth);
  const asks = orderBook.asks.slice(0, depth).reverse();

  const midPrice = tick ? ((tick.bid + tick.ask) / 2).toFixed(2) : '--';
  const spread = tick ? (tick.ask - tick.bid).toFixed(2) : '--';

  const maxBidVolume = bids.length > 0 ? Math.max(...bids.map(([, v]) => v)) : 1;
  const maxAskVolume = asks.length > 0 ? Math.max(...asks.map(([, v]) => v)) : 1;

  return (
    <div className="matrix-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="matrix-panel-header">
        ORDER BOOK
        <span style={{ float: 'right', opacity: 0.7 }}>
          Spread: {spread}
        </span>
      </div>
      
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid var(--matrix-border)',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        <span className="matrix-text-glow">{midPrice}</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table className="matrix-table" style={{ fontSize: '11px' }}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Price</th>
              <th style={{ width: '40%' }}>Size</th>
              <th style={{ width: '20%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {asks.map(([price, volume], index) => (
              <tr key={`ask-${index}`}>
                <td className="negative">
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 0, 64, 0.2)',
                      width: `${(volume / maxAskVolume) * 100}%`,
                      zIndex: 0
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{formatPrice(price)}</span>
                  </div>
                </td>
                <td>{formatVolume(volume)}</td>
                <td>{formatVolume(price * volume)}</td>
              </tr>
            ))}
            
            <tr>
              <td colSpan={3} style={{ 
                background: 'var(--matrix-green-dark)', 
                height: '2px',
                padding: 0
              }} />
            </tr>
            
            {bids.map(([price, volume], index) => (
              <tr key={`bid-${index}`}>
                <td className="positive">
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 255, 65, 0.2)',
                      width: `${(volume / maxBidVolume) * 100}%`,
                      zIndex: 0
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{formatPrice(price)}</span>
                  </div>
                </td>
                <td>{formatVolume(volume)}</td>
                <td>{formatVolume(price * volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
