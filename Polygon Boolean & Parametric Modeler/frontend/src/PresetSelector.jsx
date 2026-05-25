function PresetSelector(props) {
  const presets = [
    {
      id: 'preset1',
      name: '预设一',
      title: '共线边界的退化多边形合并',
      description: '演示共线边的重复合并与数值容差导致的微小缝隙',
      icon: '📐',
      color: '#3498db'
    },
    {
      id: 'preset2',
      name: '预设二',
      title: '自交多边形的非简单区域解析',
      description: '演示自交多边形的处理和自交点旋转标记',
      icon: '🔄',
      color: '#e74c3c'
    },
    {
      id: 'preset3',
      name: '预设三',
      title: '多点切触的奇异接触判定',
      description: '演示多个接触点的奇异边界处理和闪烁动画',
      icon: '⚡',
      color: '#f39c12'
    },
    {
      id: 'preset4',
      name: '预设四',
      title: '孔洞多边形差集运算的相反方向错误',
      description: '演示孔洞方向错误导致的内外反转问题',
      icon: '🕳️',
      color: '#9b59b6'
    }
  ];

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#f39c12' }}>🎬 预设场景</h3>
      
      <div style={{ display: 'flex', 'flex-direction': 'column', gap: '10px' }}>
        {presets.map(preset => (
          <button
            key={preset.id}
            onClick={() => props.onLoadPreset(preset.id)}
            style={{
              padding: '12px',
              border: 'none',
              'border-radius': '8px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              'font-size': '13px',
              'text-align': 'left',
              transition: 'all 0.3s',
              'border-left': `4px solid ${preset.color}`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px', 'margin-bottom': '4px' }}>
              <span style={{ 'font-size': '18px' }}>{preset.icon}</span>
              <span style={{ 'font-weight': 'bold', color: preset.color }}>{preset.name}</span>
            </div>
            <div style={{ 'font-size': '12px', color: '#ccc', 'margin-left': '26px' }}>
              {preset.title}
            </div>
            <div style={{ 'font-size': '11px', color: '#888', 'margin-left': '26px', 'margin-top': '4px' }}>
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PresetSelector;
