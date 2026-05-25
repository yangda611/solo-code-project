function HistoryPanel(props) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationName = (type) => {
    const names = {
      union: '∪ 并集',
      intersection: '∩ 交集',
      difference: '− 差集'
    };
    return names[type] || type;
  };

  const getOperationColor = (type) => {
    const colors = {
      union: '#2ecc71',
      intersection: '#3498db',
      difference: '#e74c3c'
    };
    return colors[type] || '#95a5a6';
  };

  return (
    <div style={{
      maxHeight: '300px',
      overflowY: 'auto',
      background: 'rgba(0, 0, 0, 0.2)',
      'border-radius': '8px',
      padding: '10px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#9b59b6' }}>📜 运算历史</h4>
      
      {props.history.length === 0 ? (
        <div style={{
          'text-align': 'center',
          padding: '20px',
          color: '#666',
          'font-size': '12px'
        }}>
          暂无运算记录
        </div>
      ) : (
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
          {props.history.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                'border-radius': '6px',
                'font-size': '12px',
                'border-left': `3px solid ${getOperationColor(item.operation_type)}`
              }}
            >
              <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '5px' }}>
                <span style={{ color: getOperationColor(item.operation_type), 'font-weight': 'bold' }}>
                  {getOperationName(item.operation_type)}
                </span>
                <span style={{ color: '#888' }}>
                  {formatDate(item.created_at)}
                </span>
              </div>
              <div style={{ color: '#aaa' }}>
                结果: {item.result_points.length} 个多边形
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistoryPanel;
