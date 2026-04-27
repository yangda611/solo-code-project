import React from 'react'

const StatsPanel = ({ stats }) => {
  const getStatusClass = (value, thresholds = [0.3, 0.6]) => {
    if (value < thresholds[0]) return 'positive'
    if (value < thresholds[1]) return 'warning'
    return 'danger'
  }

  const getProgressClass = (value, thresholds = [0.3, 0.6]) => {
    if (value < thresholds[0]) return 'low'
    if (value < thresholds[1]) return 'medium'
    return 'high'
  }

  const getCongestionLabel = (index) => {
    if (index < 0.3) return '畅通'
    if (index < 0.6) return '缓行'
    return '拥堵'
  }

  const getRiskLabel = (risk) => {
    if (risk < 0.3) return '低'
    if (risk < 0.6) return '中'
    return '高'
  }

  return (
    <div className="stats-panel">
      <h3>📊 实时数据</h3>
      
      <div className={`stat-card ${getStatusClass(stats.congestion_index)}`}>
        <div className="stat-label">🚦 拥堵指数</div>
        <div className="stat-value">
          {(stats.congestion_index * 100).toFixed(1)}
          <span className="stat-unit">%</span>
        </div>
        <div style={{ color: stats.congestion_index < 0.3 ? '#4ade80' : stats.congestion_index < 0.6 ? '#fbbf24' : '#f87171', fontSize: '12px', marginTop: '5px' }}>
          状态: {getCongestionLabel(stats.congestion_index)}
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressClass(stats.congestion_index)}`}
            style={{ width: `${Math.min(stats.congestion_index * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">⏱️ 平均通行时间</div>
        <div className="stat-value">
          {stats.avg_travel_time.toFixed(1)}
          <span className="stat-unit">秒</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressClass(stats.avg_travel_time / 120)}`}
            style={{ width: `${Math.min((stats.avg_travel_time / 120) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className={`stat-card ${getStatusClass(stats.accident_risk)}`}>
        <div className="stat-label">⚠️ 事故风险</div>
        <div className="stat-value">
          {(stats.accident_risk * 100).toFixed(1)}
          <span className="stat-unit">%</span>
        </div>
        <div style={{ color: stats.accident_risk < 0.3 ? '#4ade80' : stats.accident_risk < 0.6 ? '#fbbf24' : '#f87171', fontSize: '12px', marginTop: '5px' }}>
          风险等级: {getRiskLabel(stats.accident_risk)}
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${getProgressClass(stats.accident_risk)}`}
            style={{ width: `${Math.min(stats.accident_risk * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="stat-card positive">
        <div className="stat-label">🚗 总车辆数</div>
        <div className="stat-value">
          {stats.total_vehicles}
          <span className="stat-unit">辆</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">⚡ 平均速度</div>
        <div className="stat-value">
          {stats.avg_speed.toFixed(1)}
          <span className="stat-unit">km/h</span>
        </div>
        <div className="progress-bar">
          <div 
            className={`progress-fill ${stats.avg_speed > 40 ? 'low' : stats.avg_speed > 20 ? 'medium' : 'high'}`}
            style={{ width: `${Math.min((stats.avg_speed / 60) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="stat-card" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', marginTop: '20px' }}>
        <div className="stat-label" style={{ color: '#e94560' }}>📈 数据说明</div>
        <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.8', marginTop: '10px' }}>
          <p><span style={{ color: '#4ade80' }}>●</span> 绿色 = 畅通 / 低风险</p>
          <p><span style={{ color: '#fbbf24' }}>●</span> 黄色 = 缓行 / 中风险</p>
          <p><span style={{ color: '#f87171' }}>●</span> 红色 = 拥堵 / 高风险</p>
          <p style={{ marginTop: '10px' }}>数据每帧实时更新</p>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel
