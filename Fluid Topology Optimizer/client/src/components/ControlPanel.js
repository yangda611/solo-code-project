import React from 'react';

function ControlPanel({ 
  config, 
  setConfig, 
  boundaries, 
  setBoundaries,
  onStartOptimization,
  onStopOptimization,
  isOptimizing,
  currentIteration,
  onAddBoundary
}) {
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const removeBoundary = (type, index) => {
    setBoundaries(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const renderBoundaryList = (type, title, color) => {
    const list = boundaries[type] || [];
    return (
      <div className="boundary-section">
        <h4 style={{ color }}>{title} ({list.length})</h4>
        <div className="boundary-list">
          {list.map((b, idx) => (
            <div key={idx} className="boundary-item">
              <span>
                ({b.x?.toFixed(0) || 0}, {b.y?.toFixed(0) || 0}, {b.z?.toFixed(0) || 0})
              </span>
              <button 
                className="remove-btn"
                onClick={(e) => {
                  e.preventDefault();
                  removeBoundary(type, idx);
                }}
              >
                ×
              </button>
            </div>
          ))}
          {list.length === 0 && <span style={{ color: '#666', fontSize: '0.8rem' }}>暂无边界</span>}
        </div>
        <button 
          type="button"
          className="add-boundary-btn"
          onClick={(e) => {
            e.preventDefault();
            onAddBoundary(type, { x: 0, y: 0, z: 0 });
          }}
        >
          添加{title}
        </button>
      </div>
    );
  };

  return (
    <div className="panel-section">
      <h3>⚙️ 优化配置</h3>
      
      <div className="config-grid">
        <div className="config-item">
          <label>网格 X</label>
          <input 
            type="number" 
            value={config.gridSizeX}
            onChange={(e) => handleConfigChange('gridSizeX', e.target.value)}
            min={8}
            max={100}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>网格 Y</label>
          <input 
            type="number" 
            value={config.gridSizeY}
            onChange={(e) => handleConfigChange('gridSizeY', e.target.value)}
            min={8}
            max={100}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>网格 Z</label>
          <input 
            type="number" 
            value={config.gridSizeZ}
            onChange={(e) => handleConfigChange('gridSizeZ', e.target.value)}
            min={4}
            max={50}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>最小雷诺数</label>
          <input 
            type="number" 
            value={config.reynoldsMin}
            onChange={(e) => handleConfigChange('reynoldsMin', e.target.value)}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>最大雷诺数</label>
          <input 
            type="number" 
            value={config.reynoldsMax}
            onChange={(e) => handleConfigChange('reynoldsMax', e.target.value)}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>压降约束</label>
          <input 
            type="number" 
            value={config.pressureDropConstraint}
            onChange={(e) => handleConfigChange('pressureDropConstraint', e.target.value)}
            disabled={isOptimizing}
          />
        </div>
        <div className="config-item">
          <label>最小特征尺寸</label>
          <input 
            type="number" 
            value={config.minFeatureSize}
            onChange={(e) => handleConfigChange('minFeatureSize', e.target.value)}
            min={1}
            max={10}
            disabled={isOptimizing}
          />
        </div>
      </div>
      
      {renderBoundaryList('inlet', '入口', '#4ecdc4')}
      {renderBoundaryList('outlet', '出口', '#ffe66d')}
      {renderBoundaryList('solid', '不可渗透区域', '#e94560')}
      
      <div className="optimize-controls">
        <button 
          type="button"
          className="optimize-btn"
          onClick={(e) => {
            e.preventDefault();
            onStartOptimization();
          }}
          disabled={isOptimizing}
        >
          {isOptimizing ? '⏳ 优化中...' : '🚀 开始优化'}
        </button>
        {isOptimizing && (
          <button 
            type="button"
            className="optimize-btn stop-btn"
            onClick={(e) => {
              e.preventDefault();
              onStopOptimization();
            }}
          >
            ⏹ 停止
          </button>
        )}
      </div>
      
      {isOptimizing && (
        <div className="iteration-display">
          <div className="value">{currentIteration}</div>
          <div className="label">当前迭代</div>
        </div>
      )}

      {!isOptimizing && boundaries.inlet?.length === 0 && (
        <div style={{
          marginTop: '12px',
          padding: '10px',
          background: 'rgba(233, 69, 96, 0.1)',
          borderRadius: '6px',
          border: '1px solid rgba(233, 69, 96, 0.3)',
          fontSize: '0.8rem',
          color: '#e94560'
        }}>
          ⚠️ 提示：请至少添加一个入口边界条件
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
