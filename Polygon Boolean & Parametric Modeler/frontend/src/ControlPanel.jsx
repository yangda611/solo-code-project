function ControlPanel(props) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#3498db' }}>🎮 控制面板</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', 'font-size': '14px' }}>
          选择多边形类型
        </label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              props.setDrawingPolygon('subject');
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              'border-radius': '6px',
              cursor: 'pointer',
              background: props.drawingPolygon === 'subject' 
                ? 'linear-gradient(135deg, #4A90D9, #357ABD)' 
                : 'rgba(74, 144, 217, 0.3)',
              color: 'white',
              'font-size': '13px',
              transition: 'all 0.3s'
            }}
          >
            🔵 主体 ({props.subjectCount}点)
          </button>
          <button
            onClick={() => {
              props.setDrawingPolygon('clip');
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              'border-radius': '6px',
              cursor: 'pointer',
              background: props.drawingPolygon === 'clip' 
                ? 'linear-gradient(135deg, #D94A4A, #B93A3A)' 
                : 'rgba(217, 74, 74, 0.3)',
              color: 'white',
              'font-size': '13px',
              transition: 'all 0.3s'
            }}
          >
            🔴 裁剪 ({props.clipCount}点)
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => props.setIsDrawing(true)}
          disabled={props.isDrawing}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            'border-radius': '6px',
            cursor: props.isDrawing ? 'not-allowed' : 'pointer',
            background: props.isDrawing 
              ? 'rgba(155, 89, 182, 0.3)' 
              : 'linear-gradient(135deg, #2ecc71, #27ae60)',
            color: 'white',
            'font-size': '13px',
            opacity: props.isDrawing ? 0.6 : 1
          }}
        >
          ✏️ 开始绘制
        </button>
        <button
          onClick={() => {
            props.setIsDrawing(false);
          }}
          disabled={!props.isDrawing}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            'border-radius': '6px',
            cursor: !props.isDrawing ? 'not-allowed' : 'pointer',
            background: !props.isDrawing 
              ? 'rgba(52, 152, 219, 0.3)' 
              : 'linear-gradient(135deg, #3498db, #2980b9)',
            color: 'white',
            'font-size': '13px',
            opacity: !props.isDrawing ? 0.6 : 1
          }}
        >
          ✓ 完成绘制
        </button>
      </div>

      {props.isDrawing && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: 'rgba(46, 204, 113, 0.2)',
          'border-radius': '6px',
          'text-align': 'center',
          border: '2px solid #2ecc71'
        }}>
          <span style={{ 'font-size': '13px', color: '#2ecc71', 'font-weight': 'bold' }}>
            ✏️ 正在绘制 {props.drawingPolygon === 'subject' ? '主体' : '裁剪'} 多边形...
          </span>
          <br/>
          <span style={{ 'font-size': '11px', color: '#aaa' }}>
            点击画布添加顶点 | 双击或点击"完成绘制"结束
          </span>
        </div>
      )}

      <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
        <button
          onClick={props.onUndo}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            'border-radius': '6px',
            cursor: 'pointer',
            background: 'rgba(155, 89, 182, 0.5)',
            color: 'white',
            'font-size': '12px'
          }}
        >
          ↩️ 撤销上一点
        </button>
        <button
          onClick={() => {
            if (props.drawingPolygon === 'subject') {
              props.setSubjectPoints([]);
            } else {
              props.setClipPoints([]);
            }
          }}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            'border-radius': '6px',
            cursor: 'pointer',
            background: 'rgba(231, 76, 60, 0.5)',
            color: 'white',
            'font-size': '12px'
          }}
        >
          🗑️ 清空当前
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', 'font-size': '14px' }}>
          选择运算类型
        </label>
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px' }}>
          {[
            { value: 'union', label: '∪ 并集 (Union)', color: '#2ecc71' },
            { value: 'intersection', label: '∩ 交集 (Intersection)', color: '#3498db' },
            { value: 'difference', label: '− 差集 (Difference)', color: '#e74c3c' }
          ].map(op => (
            <button
              key={op.value}
              onClick={() => props.setOperation(op.value)}
              style={{
                padding: '10px',
                border: props.operation === op.value ? `2px solid ${op.color}` : 'none',
                'border-radius': '6px',
                cursor: 'pointer',
                background: props.operation === op.value 
                  ? `${op.color}30` 
                  : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                'font-size': '13px',
                'text-align': 'left',
                transition: 'all 0.3s'
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={props.onPerform}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            'border-radius': '8px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            color: 'white',
            'font-size': '14px',
            'font-weight': 'bold'
          }}
        >
          ⚡ 执行运算
        </button>
        <button
          onClick={props.onClear}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            'border-radius': '8px',
            cursor: 'pointer',
            background: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
            color: 'white',
            'font-size': '14px'
          }}
        >
          🗑️ 全部清空
        </button>
      </div>
    </div>
  );
}

export default ControlPanel;
