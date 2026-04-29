import React from 'react';
import './Tile.css';

const SUIT_COLORS = {
  wan: '#c41e3a',
  tiao: '#228b22',
  tong: '#1e90ff',
  feng: '#333',
  zi: '#333'
};

const FENG_NAMES = ['东', '南', '西', '北'];
const ZI_NAMES = ['中', '发', '白'];

function getTileDisplay(tile) {
  if (!tile) return '';
  
  const { suit, value } = tile;
  
  switch (suit) {
    case 'wan':
      return `${value}万`;
    case 'tiao':
      return `${value}条`;
    case 'tong':
      return `${value}筒`;
    case 'feng':
      return FENG_NAMES[value - 1];
    case 'zi':
      return ZI_NAMES[value - 1];
    default:
      return '';
  }
}

function Tile({ 
  tile, 
  isFaceDown = false, 
  isSelected = false,
  isHighlighted = false,
  isWaiting = false,
  onClick,
  size = 'normal',
  animation = null
}) {
  const display = tile ? getTileDisplay(tile) : '';
  const color = tile ? SUIT_COLORS[tile.suit] : '#333';
  
  const sizeClasses = {
    small: 'tile-small',
    normal: 'tile-normal',
    large: 'tile-large'
  };
  
  const animationClasses = {
    flip: 'animate-flip',
    slide: 'animate-slide',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    highlight: 'animate-highlight'
  };
  
  return (
    <div
      className={`
        tile 
        ${sizeClasses[size]}
        ${isFaceDown ? 'tile-face-down' : ''}
        ${isSelected ? 'tile-selected' : ''}
        ${isHighlighted ? 'tile-highlighted' : ''}
        ${isWaiting ? 'tile-waiting' : ''}
        ${animation ? animationClasses[animation] : ''}
      `}
      onClick={onClick}
      style={{
        '--tile-color': color
      }}
    >
      {!isFaceDown && (
        <div className="tile-content">
          <span className="tile-text" style={{ color }}>
            {display}
          </span>
          {tile && tile.suit === 'tong' && (
            <div className="tile-dots">
              {Array.from({ length: tile.value }).map((_, i) => (
                <div key={i} className="tile-dot" style={{ color }} />
              ))}
            </div>
          )}
        </div>
      )}
      {isFaceDown && (
        <div className="tile-back" />
      )}
    </div>
  );
}

export default React.memo(Tile);
