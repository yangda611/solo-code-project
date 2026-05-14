import React from 'react';

const presets = [
  {
    id: 'microchannel',
    name: '微通道散热器',
    description: '高密度微通道散热，适用于电子芯片冷却',
    icon: '🔥'
  },
  {
    id: 'manifold',
    name: '歧管分配器',
    description: '多通道流体均匀分配，适用于化工流程',
    icon: '🔀'
  },
  {
    id: 'airfoil',
    name: '气动减阻翼型',
    description: '流线型拓扑优化，适用于航空航天',
    icon: '✈️'
  },
  {
    id: 'dialysis',
    name: '血液透析流道',
    description: '生物医学流道设计，适用于医疗设备',
    icon: '💉'
  }
];

function PresetSelector({ onLoadPreset, isOptimizing }) {
  return (
    <div className="panel-section">
      <h3>🎯 预设场景</h3>
      <div className="presets-grid">
        {presets.map((preset) => (
          <button 
            key={preset.id}
            type="button"
            className="preset-btn"
            onClick={(e) => {
              e.preventDefault();
              onLoadPreset(preset.id);
            }}
            disabled={isOptimizing}
          >
            <div className="preset-icon">{preset.icon}</div>
            <div className="preset-name">{preset.name}</div>
            <div className="preset-desc">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PresetSelector;
