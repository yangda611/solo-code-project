import React from 'react';
import Tile from '../Tile/Tile';
import './HuResultModal.css';

function HuResultModal({ result, onClose }) {
  if (!result) return null;
  
  const {
    winner,
    winningTile,
    totalFan,
    fanDetails,
    isSelfDrawn,
    isLastTile,
    isRobKong
  } = result;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🎉 胡牌!</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="winner-info">
            <div className="winner-name">{winner?.name}</div>
            <div className="winner-action">
              {isSelfDrawn ? '自摸' : isRobKong ? '抢杠' : isLastTile ? '海底捞月' : '点炮胡'}
            </div>
          </div>
          
          <div className="winning-tile">
            <div className="winning-label">胡牌:</div>
            <Tile tile={winningTile} size="large" animation="bounce" />
          </div>
          
          <div className="fan-summary">
            <div className="fan-total">
              <span className="fan-number">{totalFan}</span>
              <span className="fan-unit">番</span>
            </div>
          </div>
          
          <div className="fan-details">
            <h3 className="details-title">番型详情:</h3>
            <div className="fan-list">
              {fanDetails.map((fan, idx) => (
                <div key={idx} className="fan-item">
                  <span className="fan-name">{fan.name}</span>
                  <span className="fan-value">{fan.value}番</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="confirm-btn" onClick={onClose}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(HuResultModal);
