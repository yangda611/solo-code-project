import { createSignal, createEffect, onMount } from 'solid-js';
import Canvas from './Canvas';
import ControlPanel from './ControlPanel';
import PresetSelector from './PresetSelector';
import HistoryPanel from './HistoryPanel';

function App() {
  const [subject, setSubject] = createSignal([]);
  const [clip, setClip] = createSignal([]);
  const [result, setResult] = createSignal([]);
  const [intersections, setIntersections] = createSignal([]);
  const [selfIntersections, setSelfIntersections] = createSignal([]);
  const [operation, setOperation] = createSignal('union');
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [drawingPolygon, setDrawingPolygon] = createSignal('subject');
  const [animationPhase, setAnimationPhase] = createSignal('idle');
  const [warnings, setWarnings] = createSignal({});
  const [showHistory, setShowHistory] = createSignal(false);
  const [history, setHistory] = createSignal([]);

  const API_BASE = 'http://localhost:3001/api';

  onMount(async () => {
    await loadHistory();
  });

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const performBoolean = async () => {
    if (subject().length < 3 || clip().length < 3) {
      alert('请先绘制两个完整的多边形（至少3个点）');
      return;
    }

    setAnimationPhase('calculating');
    setResult([]);
    setIntersections([]);

    try {
      const res = await fetch(`${API_BASE}/boolean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject(),
          clip: clip(),
          operation: operation()
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setIntersections(data.intersections || []);
        setSelfIntersections(data.selfIntersections || []);
        setWarnings(data.warnings || {});
        
        setAnimationPhase('intersections');
        await delay(800);
        
        setAnimationPhase('filling');
        await delay(1200);
        
        setResult(data.result || []);
        setAnimationPhase('result');
        await delay(600);
        
        setAnimationPhase('idle');
        await loadHistory();
      }
    } catch (error) {
      console.error('Boolean operation failed:', error);
      setAnimationPhase('error');
      await delay(1000);
      setAnimationPhase('idle');
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const addPoint = (x, y) => {
    if (!isDrawing()) return;
    
    const points = drawingPolygon() === 'subject' ? subject() : clip();
    const setPoints = drawingPolygon() === 'subject' ? setSubject : setClip;
    
    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const clearAll = () => {
    setSubject([]);
    setClip([]);
    setResult([]);
    setIntersections([]);
    setSelfIntersections([]);
    setWarnings({});
    setAnimationPhase('idle');
  };

  const loadPreset = async (presetName) => {
    try {
      const res = await fetch(`${API_BASE}/presets`);
      const data = await res.json();
      
      if (data.success && data.presets[presetName]) {
        const preset = data.presets[presetName];
        setSubject(preset.subject);
        setClip(preset.clip);
        setOperation(preset.operation);
        setResult([]);
        setIntersections([]);
        setSelfIntersections([]);
        setWarnings({});
      }
    } catch (e) {
      console.error('Failed to load preset:', e);
    }
  };

  const undoLastPoint = () => {
    const points = drawingPolygon() === 'subject' ? subject() : clip();
    const setPoints = drawingPolygon() === 'subject' ? setSubject : setClip;
    
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)'
      }}>
        <Canvas
          subject={subject()}
          clip={clip()}
          result={result()}
          intersections={intersections()}
          selfIntersections={selfIntersections()}
          isDrawing={isDrawing()}
          drawingPolygon={drawingPolygon()}
          animationPhase={animationPhase()}
          warnings={warnings()}
          onAddPoint={addPoint}
          onFinishDrawing={finishDrawing}
          setSubjectPoints={setSubject}
          setClipPoints={setClip}
        />
        
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px 20px',
          'border-radius': '10px',
          'backdrop-filter': 'blur(10px)'
        }}>
          <h1 style={{
            'font-size': '24px',
            'margin-bottom': '8px',
            background: 'linear-gradient(90deg, #4A90D9, #9B59B6)',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent'
          }}>
            二维多边形布尔运算器
          </h1>
          <p style={{ 'font-size': '12px', color: '#aaa' }}>
            Greiner-Hormann 算法 | 边界奇异性修复
          </p>
        </div>

        {(warnings().hasSelfIntersections || warnings().hasDegeneratePolygons || warnings().hasCollinearEdges) && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(231, 76, 60, 0.9)',
            padding: '15px',
            'border-radius': '10px',
            'max-width': '350px'
          }}>
            <h4 style={{ 'margin-bottom': '10px' }}>⚠️ 检测到的问题：</h4>
            <ul style={{ 'font-size': '12px', 'padding-left': '20px' }}>
              {warnings().hasSelfIntersections && (
                <li>检测到自交多边形 - 自交点已标记</li>
              )}
              {warnings().hasDegeneratePolygons && (
                <li>退化多边形 - 面积计算可能失效</li>
              )}
              {result().some(p => p.length < 10) && (
                <li>数值容差导致微小缝隙/重叠</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div style={{
        width: '340px',
        background: 'rgba(26, 26, 46, 0.95)',
        padding: '20px',
        overflowY: 'auto',
        'border-left': '1px solid #333'
      }}>
        <ControlPanel
          operation={operation()}
          setOperation={setOperation}
          isDrawing={isDrawing()}
          setIsDrawing={setIsDrawing}
          drawingPolygon={drawingPolygon()}
          setDrawingPolygon={setDrawingPolygon}
          onPerform={performBoolean}
          onClear={clearAll}
          onUndo={undoLastPoint}
          subjectCount={subject().length}
          clipCount={clip().length}
          setSubjectPoints={setSubject}
          setClipPoints={setClip}
        />

        <PresetSelector onLoadPreset={loadPreset} />

        <button
          onClick={() => setShowHistory(!showHistory())}
          style={{
            width: '100%',
            padding: '12px',
            margin: '15px 0',
            background: 'linear-gradient(135deg, #3498db, #2980b9)',
            border: 'none',
            'border-radius': '8px',
            color: 'white',
            'font-size': '14px',
            cursor: 'pointer'
          }}
        >
          📜 {showHistory() ? '隐藏' : '显示'}运算历史
        </button>

        {showHistory() && <HistoryPanel history={history()} />}

        <div style={{
          margin: '20px 0',
          padding: '15px',
          background: 'rgba(52, 152, 219, 0.1)',
          'border-radius': '8px',
          'font-size': '12px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>使用说明</h4>
          <ol style={{ margin: 0, 'padding-left': '20px', color: '#ccc' }}>
            <li>选择"主体"或"裁剪"多边形类型</li>
            <li>点击"开始绘制"按钮进入绘制模式</li>
            <li>在画布上点击添加顶点</li>
            <li>双击或点击"完成绘制"结束绘制</li>
            <li><strong>拖拽锚点</strong>：鼠标悬停在顶点上，按住拖动可调整位置</li>
            <li>选择运算类型并点击"执行运算"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;
