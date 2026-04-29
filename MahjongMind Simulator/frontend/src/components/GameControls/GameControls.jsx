import React from 'react';
import './GameControls.css';

function GameControls({ 
  gameState, 
  onDraw, 
  onDiscard, 
  onChi, 
  onPeng, 
  onGang, 
  onHu,
  onSkip,
  availableActions,
  selectedTile
}) {
  const isCurrentPlayer = gameState.currentPlayer === 0;
  const hasDiscard = gameState.lastDiscard !== null;
  const waitingForAction = gameState.waitingForPlayerAction === true;
  const playerHandLength = gameState.players[0]?.hand?.length || 0;
  
  const canDraw = isCurrentPlayer && !waitingForAction && playerHandLength <= 13 && gameState.wall.length > 0;
  const canDiscard = isCurrentPlayer && !waitingForAction && selectedTile !== null && playerHandLength > 13;
  
  const canPeng = waitingForAction && availableActions.peng;
  const canGang = waitingForAction && availableActions.gang;
  const canHuAction = waitingForAction && availableActions.hu;
  const canSkip = waitingForAction;
  
  const canHuSelf = !waitingForAction && isCurrentPlayer && availableActions.hu;
  
  return (
    <div className="game-controls">
      <div className="action-buttons">
        <div className="primary-actions">
          {canDraw && (
            <button 
              className="action-btn draw-btn"
              onClick={onDraw}
            >
              <span className="btn-icon">🎴</span>
              <span className="btn-text">摸牌</span>
            </button>
          )}
          
          {canDiscard && (
            <button 
              className="action-btn discard-btn"
              onClick={onDiscard}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">打牌</span>
            </button>
          )}
          
          {canHuSelf && (
            <button 
              className="action-btn hu-btn"
              onClick={onHu}
            >
              <span className="btn-icon">🎉</span>
              <span className="btn-text">胡</span>
            </button>
          )}
        </div>
        
        <div className="response-actions">
          {canHuAction && (
            <button 
              className="action-btn hu-btn"
              onClick={onHu}
            >
              <span className="btn-icon">🎉</span>
              <span className="btn-text">胡</span>
            </button>
          )}
          
          {canGang && (
            <button 
              className="action-btn gang-btn"
              onClick={onGang}
            >
              <span className="btn-icon">📦</span>
              <span className="btn-text">杠</span>
            </button>
          )}
          
          {canPeng && (
            <button 
              className="action-btn peng-btn"
              onClick={onPeng}
            >
              <span className="btn-icon">🤝</span>
              <span className="btn-text">碰</span>
            </button>
          )}
          
          {canSkip && (
            <button 
              className="action-btn skip-btn"
              onClick={onSkip}
            >
              <span className="btn-icon">⏭️</span>
              <span className="btn-text">过</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="game-info">
        <div className="info-item">
          <span className="info-label">当前玩家:</span>
          <span className="info-value">{gameState.players[gameState.currentPlayer]?.name}</span>
        </div>
        <div className="info-item">
          <span className="info-label">剩余牌:</span>
          <span className="info-value">{gameState.wall.length}</span>
        </div>
        <div className="info-item">
          <span className="info-label">回合:</span>
          <span className="info-value">第 {gameState.round} 局</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GameControls);
