import React from 'react';
import Hand from '../Hand/Hand';
import Tile from '../Tile/Tile';
import './Table.css';

function Table({ gameState, onTileClick, selectedTile }) {
  const { players, wall, deadWall, lastDiscard, lastDiscardPlayer } = gameState;
  
  const playerPositions = [
    { player: players[0], position: 'bottom' },
    { player: players[1], position: 'right' },
    { player: players[2], position: 'top' },
    { player: players[3], position: 'left' }
  ];
  
  const getDiscardAreaPosition = (playerIndex) => {
    const positions = ['center-bottom', 'center-right', 'center-top', 'center-left'];
    return positions[playerIndex];
  };
  
  return (
    <div className="table-container">
      <div className="table-border">
        <div className="table-felt">
          <div className="wall-indicator">
            <div className="wall-stack">
              {wall.length > 0 && (
                <>
                  <Tile tile={wall[wall.length - 1]} isFaceDown size="small" />
                  <div className="wall-count">{wall.length}</div>
                </>
              )}
            </div>
            <div className="dead-wall-stack">
              {deadWall.length > 0 && (
                <>
                  <Tile tile={deadWall[deadWall.length - 1]} isFaceDown size="small" />
                  <div className="dead-wall-count">灵牌: {deadWall.length}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="discard-area discard-center-top">
            {players[2].discards.slice(-6).map((tile, idx) => (
              <Tile 
                key={`discard-2-${idx}`} 
                tile={tile} 
                size="small"
                animation={idx === players[2].discards.length - 1 ? 'slide' : null}
              />
            ))}
          </div>
          
          <div className="discard-area discard-center-right">
            {players[1].discards.slice(-6).map((tile, idx) => (
              <Tile 
                key={`discard-1-${idx}`} 
                tile={tile} 
                size="small"
                animation={idx === players[1].discards.length - 1 ? 'slide' : null}
              />
            ))}
          </div>
          
          <div className="discard-area discard-center-bottom">
            {players[0].discards.slice(-12).map((tile, idx) => (
              <Tile 
                key={`discard-0-${idx}`} 
                tile={tile} 
                size="small"
                animation={idx === players[0].discards.length - 1 ? 'slide' : null}
              />
            ))}
          </div>
          
          <div className="discard-area discard-center-left">
            {players[3].discards.slice(-6).map((tile, idx) => (
              <Tile 
                key={`discard-3-${idx}`} 
                tile={tile} 
                size="small"
                animation={idx === players[3].discards.length - 1 ? 'slide' : null}
              />
            ))}
          </div>
          
          {lastDiscard && (
            <div className="last-discard-indicator">
              <Tile 
                tile={lastDiscard} 
                size="large"
                isHighlighted={true}
                animation="bounce"
              />
              <div className="last-discard-player">
                {players[lastDiscardPlayer]?.name} 打出
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="player-area player-top">
        <div className="player-info">
          <span className="player-name">{players[2].name}</span>
          <span className="player-score">{players[2].score}</span>
          {players[2].isDealer && <span className="dealer-badge">庄</span>}
        </div>
        <Hand 
          tiles={players[2].hand}
          melds={players[2].melds}
          orientation="top"
        />
      </div>
      
      <div className="player-area player-right">
        <div className="player-info">
          <span className="player-name">{players[1].name}</span>
          <span className="player-score">{players[1].score}</span>
          {players[1].isDealer && <span className="dealer-badge">庄</span>}
        </div>
        <Hand 
          tiles={players[1].hand}
          melds={players[1].melds}
          orientation="right"
        />
      </div>
      
      <div className="player-area player-bottom">
        <div className="player-info">
          <span className="player-name">{players[0].name}</span>
          <span className="player-score">{players[0].score}</span>
          {players[0].isDealer && <span className="dealer-badge">庄</span>}
        </div>
        <Hand 
          tiles={players[0].hand}
          melds={players[0].melds}
          orientation="bottom"
          isCurrentPlayer={true}
          onTileClick={onTileClick}
          selectedIndex={selectedTile}
        />
      </div>
      
      <div className="player-area player-left">
        <div className="player-info">
          <span className="player-name">{players[3].name}</span>
          <span className="player-score">{players[3].score}</span>
          {players[3].isDealer && <span className="dealer-badge">庄</span>}
        </div>
        <Hand 
          tiles={players[3].hand}
          melds={players[3].melds}
          orientation="left"
        />
      </div>
    </div>
  );
}

export default React.memo(Table);
