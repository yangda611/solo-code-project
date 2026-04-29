import React from 'react';
import Tile from '../Tile/Tile';
import './AnalysisPanel.css';

function AnalysisPanel({ analysis, isOpen, onToggle }) {
  if (!analysis) return null;
  
  const {
    isWaiting,
    waitingTiles,
    shanten,
    stage,
    bestDiscard,
    remainingCount,
    totalRemaining
  } = analysis;
  
  return (
    <div className={`analysis-panel ${isOpen ? 'open' : ''}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? '收起分析' : '展开分析'}
      </button>
      
      {isOpen && (
        <div className="panel-content">
          <div className="analysis-section">
            <h3 className="section-title">当前状态</h3>
            <div className="status-cards">
              <div className={`status-card ${isWaiting ? 'success' : 'warning'}`}>
                <div className="status-value">{isWaiting ? '听牌' : `${shanten}向听`}</div>
                <div className="status-label">{stage}</div>
              </div>
              <div className="status-card">
                <div className="status-value">{totalRemaining}</div>
                <div className="status-label">剩余牌数</div>
              </div>
            </div>
          </div>
          
          {isWaiting && waitingTiles.length > 0 && (
            <div className="analysis-section">
              <h3 className="section-title">听牌分析</h3>
              <div className="waiting-tiles">
                <div className="waiting-label">可胡牌型:</div>
                <div className="tiles-grid">
                  {waitingTiles.map((wt, idx) => (
                    <div key={idx} className="waiting-tile-item">
                      <Tile tile={wt.tile} size="small" isWaiting={true} />
                      <div className="tile-info">
                        <div className="tile-count">剩余: {wt.remaining}张</div>
                        <div className="tile-prob">
                          概率: {(wt.probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {bestDiscard && !isWaiting && (
            <div className="analysis-section">
              <h3 className="section-title">
                {bestDiscard.bestOption?.isDirectWaiting ? '听牌建议' : '最优出牌建议'}
              </h3>
              <div className="best-discard">
                <div className="discard-preview">
                  <Tile 
                    tile={bestDiscard.bestOption?.discardTile} 
                    size="normal"
                    isHighlighted={true}
                  />
                </div>
                <div className="discard-info">
                  <div className="info-row">
                    <span className="info-key">推荐打出:</span>
                    <span className="info-value">
                      {bestDiscard.bestOption?.discardTile?.display}
                    </span>
                  </div>
                  {bestDiscard.bestOption?.isDirectWaiting ? (
                    <>
                      <div className="info-row" style={{color: '#4caf50', fontWeight: 'bold'}}>
                        <span className="info-key">状态:</span>
                        <span className="info-value">
                          打出后直接听牌!
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-key">听牌张数:</span>
                        <span className="info-value">
                          {bestDiscard.bestOption?.waitingCount}种
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-key">剩余数量:</span>
                        <span className="info-value">
                          {bestDiscard.bestOption?.totalRemaining}张
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-row">
                        <span className="info-key">进张数量:</span>
                        <span className="info-value">
                          {bestDiscard.bestOption?.oneEntryCount}种
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="info-key">综合评分:</span>
                        <span className="info-value">
                          {bestDiscard.bestOption?.score.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {bestDiscard.allOptions && bestDiscard.allOptions.length > 1 && (
                <div className="other-options">
                  <h4 className="options-title">其他可选方案:</h4>
                  <div className="options-list">
                    {bestDiscard.allOptions.slice(1, 4).map((option, idx) => (
                      <div key={idx} className="option-item">
                        <Tile tile={option.discardTile} size="small" />
                        <span className="option-score">
                          评分: {option.score.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="analysis-section">
            <h3 className="section-title">剩余牌统计</h3>
            <div className="remaining-summary">
              {Object.entries(remainingCount).map(([tileId, count]) => {
                if (count <= 0) return null;
                const [suit, value] = tileId.split('_');
                return (
                  <div key={tileId} className="remaining-item">
                    <span className="remaining-suit">
                      {suit === 'wan' ? '万' : suit === 'tiao' ? '条' : suit === 'tong' ? '筒' : ''}
                    </span>
                    <span className="remaining-value">{value}</span>
                    <span className="remaining-count">x{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(AnalysisPanel);
