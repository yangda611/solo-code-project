import React from 'react';
import Tile from '../Tile/Tile';
import './Hand.css';

function Hand({ 
  tiles, 
  melds = [], 
  selectedIndex,
  waitingTiles = [],
  onTileClick,
  isCurrentPlayer = false,
  drawnTile = null,
  orientation = 'bottom'
}) {
  const waitingTileIds = new Set(waitingTiles.map(t => `${t.suit}_${t.value}`));
  
  const isWaitingTile = (tile) => {
    return waitingTileIds.has(`${tile.suit}_${tile.value}`);
  };
  
  const sortedTiles = [...tiles].sort((a, b) => {
    const suitOrder = { wan: 0, tiao: 1, tong: 2, feng: 3, zi: 4 };
    const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return a.value - b.value;
  });
  
  const renderMeld = (meld, index) => {
    const isConcealed = meld.isConcealed;
    
    return (
      <div key={`meld-${index}`} className="meld-group">
        {meld.tiles.map((tile, tileIndex) => (
          <Tile
            key={`${index}-${tileIndex}`}
            tile={tile}
            isFaceDown={isConcealed && meld.type !== 'chi'}
            size="small"
          />
        ))}
      </div>
    );
  };
  
  const renderTiles = () => {
    if (orientation === 'bottom') {
      return (
        <div className="hand-container hand-bottom">
          {melds.length > 0 && (
            <div className="melds-container">
              {melds.map((meld, index) => renderMeld(meld, index))}
            </div>
          )}
          <div className="tiles-container">
            {sortedTiles.map((tile, index) => {
              const isDrawn = drawnTile && 
                tile.suit === drawnTile.suit && 
                tile.value === drawnTile.value;
              
              return (
                <Tile
                  key={`tile-${index}`}
                  tile={tile}
                  isSelected={selectedIndex === index}
                  isHighlighted={isDrawn}
                  isWaiting={isWaitingTile(tile)}
                  onClick={() => onTileClick && onTileClick(index, tile)}
                  animation={isDrawn ? 'flip' : null}
                />
              );
            })}
          </div>
        </div>
      );
    }
    
    return (
      <div className={`hand-container hand-${orientation}`}>
        {melds.length > 0 && (
          <div className="melds-container">
            {melds.map((meld, index) => renderMeld(meld, index))}
          </div>
        )}
        <div className="tiles-container">
          {sortedTiles.map((tile, index) => (
            <Tile
              key={`tile-${index}`}
              tile={tile}
              isFaceDown={orientation !== 'bottom'}
              size="small"
            />
          ))}
        </div>
      </div>
    );
  };
  
  return renderTiles();
}

export default React.memo(Hand);
