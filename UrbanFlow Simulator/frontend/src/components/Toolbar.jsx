import React from 'react'

const Toolbar = ({
  selectedTool,
  onSelectTool,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  intersections,
  roads
}) => {
  const tools = [
    { id: 'select', label: '选择', icon: '👆' },
    { id: 'intersection', label: '路口', icon: '🔘' },
    { id: 'road', label: '道路', icon: '🛣️' },
    { id: 'traffic_light', label: '红绿灯', icon: '🚦' },
    { id: 'spawn_point', label: '车辆生成', icon: '🚗' },
    { id: 'delete', label: '删除', icon: '🗑️' }
  ]

  const handleToolSelect = (toolId) => {
    if (isSimulating && toolId !== 'select') {
      return
    }
    onSelectTool(toolId)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>🎨 绘图工具</h3>
        <div className="toolbar-tools">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => handleToolSelect(tool.id)}
              disabled={isSimulating && tool.id !== 'select'}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3>🎮 仿真控制</h3>
        <div className="simulation-controls">
          <button
            className="control-btn start"
            onClick={onStartSimulation}
            disabled={isSimulating || intersections.length < 2 || roads.length < 1}
          >
            {isSimulating ? '运行中...' : '▶ 开始'}
          </button>
          <button
            className="control-btn stop"
            onClick={onStopSimulation}
            disabled={!isSimulating}
          >
            ⏹ 停止
          </button>
        </div>
        {intersections.length < 2 && (
          <p style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
            ⚠️ 需要至少2个路口才能开始仿真
          </p>
        )}
        {intersections.length >= 2 && roads.length < 1 && (
          <p style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
            ⚠️ 需要至少1条道路才能开始仿真
          </p>
        )}
      </div>

      <div className="toolbar-section">
        <h3>📊 当前状态</h3>
        <div style={{ fontSize: '13px', color: '#e0e0e0' }}>
          <p>🔘 路口: {intersections.length}</p>
          <p>🛣️ 道路: {roads.length}</p>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>📖 使用说明</h3>
        <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.8' }}>
          <p>1. 选择"路口"工具，在画布上点击创建路口</p>
          <p>2. 选择"道路"工具，依次点击两个路口创建道路</p>
          <p>3. 选择"红绿灯"工具，点击路口添加红绿灯</p>
          <p>4. 选择"车辆生成"工具，点击道路添加生成点</p>
          <p>5. 点击"开始"启动交通仿真</p>
        </div>
      </div>
    </div>
  )
}

export default Toolbar
