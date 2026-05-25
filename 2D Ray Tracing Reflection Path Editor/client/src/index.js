import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [obstacles, setObstacles] = useState([]);
  const [lights, setLights] = useState([]);
  const [paths, setPaths] = useState([]);
  const [loops, setLoops] = useState([]);
  const [stats, setStats] = useState(null);
  const [tool, setTool] = useState('obstacle');
  const [material, setMaterial] = useState('mirror');
  const [refractiveIndex, setRefractiveIndex] = useState(1.5);
  const [maxBounces, setMaxBounces] = useState(10);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [animTime, setAnimTime] = useState(0);
  const [presets, setPresets] = useState([]);
  const [currentPreset, setCurrentPreset] = useState(-1);

  useEffect(() => {
    fetch('/api/presets')
      .then(res => res.json())
      .then(data => setPresets(data));
  }, []);

  const loadPreset = (index) => {
    fetch(`/api/presets/${index}`)
      .then(res => res.json())
      .then(data => {
        setObstacles(data.obstacles || []);
        setLights(data.lights || []);
        setCurrentPreset(index);
        setPaths([]);
        setLoops([]);
        setStats(null);
      });
  };

  const traceRays = useCallback(async () => {
    const res = await fetch('/api/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lights, obstacles, maxBounces })
    });
    const data = await res.json();
    setPaths(data.paths);
    setLoops(data.loops);
    setStats(data.stats);
  }, [lights, obstacles, maxBounces]);

  useEffect(() => {
    if (lights.length > 0 && obstacles.length > 0) {
      traceRays();
    }
  }, [lights.length, obstacles.length, maxBounces]);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      setAnimTime(t => t + delta * 0.001);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (obstacles.length > 0) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        for (const obs of obstacles) {
          const dx = Math.sin(animTime * 0.5 + i) * 10;
          const dy = Math.cos(animTime * 0.5 + i) * 10;
          ctx.moveTo(obs.x1 + dx, obs.y1 + dy);
          ctx.lineTo(obs.x2 + dx, obs.y2 + dy);
        }
        ctx.fill();
      }
      ctx.restore();
    }

    for (const obs of obstacles) {
      const colors = { mirror: '#00ffff', transparent: '#00ff88', absorber: '#ff4444' };
      ctx.strokeStyle = colors[obs.material] || '#00ffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = colors[obs.material] || '#00ffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(obs.x1, obs.y1);
      ctx.lineTo(obs.x2, obs.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (obs.material === 'transparent') {
        const cx = (obs.x1 + obs.x2) / 2;
        const cy = (obs.y1 + obs.y2) / 2;
        ctx.fillStyle = '#00ff88';
        ctx.font = '10px Arial';
        ctx.fillText(`n=${obs.refractiveIndex || 1.5}`, cx, cy - 10);
      }
    }

    for (const light of lights) {
      const pulse = 0.5 + 0.5 * Math.sin(animTime * 4);
      ctx.beginPath();
      ctx.arc(light.x, light.y, 15 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 0, ${0.3 * pulse})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(light.x, light.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (light.type === 'parallel') {
        const dirX = Math.cos(light.angle);
        const dirY = Math.sin(light.angle);
        ctx.beginPath();
        ctx.moveTo(light.x, light.y);
        ctx.lineTo(light.x + dirX * 30, light.y + dirY * 30);
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const path of paths) {
      if (path.type === 'segment' || path.type === 'escape') {
        const alpha = Math.min(1, path.energy * 2);
        const hue = 200 - (path.depth || 0) * 15;
        ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.lineWidth = Math.max(1, path.energy * 3);
        ctx.beginPath();
        ctx.moveTo(path.start.x, path.start.y);
        ctx.lineTo(path.end.x, path.end.y);
        ctx.stroke();

        const len = Math.sqrt(Math.pow(path.end.x - path.start.x, 2) + Math.pow(path.end.y - path.start.y, 2));
        const progress = (animTime * 50 + path.depth * 30) % len;
        const t = progress / len;
        const dotX = path.start.x + (path.end.x - path.start.x) * t;
        const dotY = path.start.y + (path.end.y - path.start.y) * t;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${alpha})`;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 1)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (path.type === 'escape') {
          const blink = 0.5 + 0.5 * Math.sin(animTime * 8);
          ctx.beginPath();
          ctx.arc(path.end.x, path.end.y, 8 * blink, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 0, 0, ${blink})`;
          ctx.fill();
        }
      }

      if (path.type === 'absorb' || (path.type === 'segment' && path.end)) {
        const point = path.type === 'absorb' ? path.point : path.end;
        if (point) {
          const ripple = (animTime * 2 + path.depth * 0.5) % 1;
          const radius = 5 + ripple * 20;
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 100, 0, ${(1 - ripple) * path.energy})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    for (const loop of loops) {
      const blink = 0.5 + 0.5 * Math.sin(animTime * 6);
      ctx.beginPath();
      ctx.arc(loop.point.x, loop.point.y, 20 * blink, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 0, 255, ${blink})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (stats && stats.hasPerformanceIssue) {
      const blink = 0.3 + 0.7 * Math.sin(animTime * 3);
      ctx.fillStyle = `rgba(255, 0, 0, ${blink * 0.3})`;
      ctx.fillRect(width - 120, 10, 110, 30);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.fillText('性能警告!', width - 110, 30);
    }

    if (drawing && startPoint && mousePos) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [obstacles, lights, paths, loops, stats, drawing, startPoint, mousePos, animTime]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'light') {
      setLights([...lights, { x, y, type: 'point', numRays: 36 }]);
    } else {
      setDrawing(true);
      setStartPoint({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = (e) => {
    if (!drawing || !startPoint) {
      setDrawing(false);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dist = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));

    if (dist > 10) {
      setObstacles([...obstacles, {
        x1: startPoint.x,
        y1: startPoint.y,
        x2: x,
        y2: y,
        material,
        refractiveIndex
      }]);
    }

    setDrawing(false);
    setStartPoint(null);
  };

  const clearAll = () => {
    setObstacles([]);
    setLights([]);
    setPaths([]);
    setLoops([]);
    setStats(null);
    setCurrentPreset(-1);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a1a' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setDrawing(false); setStartPoint(null); }}
          style={{ border: '2px solid #333', borderRadius: '8px', cursor: 'crosshair' }}
        />

        {stats && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#1a1a2e', borderRadius: '8px', color: '#fff', fontSize: '12px' }}>
            <div>总路径数: {stats.totalPaths} | 逃逸: {stats.escapedPaths} | 吸收: {stats.absorbedPaths}</div>
            <div>最大反射深度: {stats.maxDepth} | 计算时间: {stats.computeTime}ms</div>
            {stats.hasPerformanceIssue && <div style={{ color: '#ff6666' }}>⚠️ 性能下降 - 反射深度过高或路径过多</div>}
          </div>
        )}
      </div>

      <div style={{ width: '280px', padding: '20px', background: '#1a1a2e', color: '#fff' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#00ffff' }}>光线追踪编辑器</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>工具</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setTool('obstacle')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: tool === 'obstacle' ? '#00ffff' : '#333', color: tool === 'obstacle' ? '#000' : '#fff', cursor: 'pointer' }}
            >
              障碍物
            </button>
            <button
              onClick={() => setTool('light')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: tool === 'light' ? '#ffcc00' : '#333', color: tool === 'light' ? '#000' : '#fff', cursor: 'pointer' }}
            >
              光源
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>材质</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            style={{ width: '100%', padding: '8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            <option value="mirror">镜面反射</option>
            <option value="transparent">透明折射</option>
            <option value="absorber">完全吸收</option>
          </select>
        </div>

        {material === 'transparent' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>折射率: {refractiveIndex}</label>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.1"
              value={refractiveIndex}
              onChange={(e) => setRefractiveIndex(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>最大反射次数: {maxBounces}</label>
          <input
            type="range"
            min="1"
            max="50"
            value={maxBounces}
            onChange={(e) => setMaxBounces(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>预设场景</label>
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => loadPreset(i)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '5px',
                border: 'none',
                borderRadius: '4px',
                background: currentPreset === i ? '#00ff88' : '#333',
                color: currentPreset === i ? '#000' : '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left'
              }}
            >
              {i + 1}. {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={traceRays}
          style={{ width: '100%', padding: '12px', marginBottom: '10px', border: 'none', borderRadius: '4px', background: '#00ffff', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
        >
          重新计算光路
        </button>

        <button
          onClick={clearAll}
          style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '4px', background: '#ff4444', color: '#fff', cursor: 'pointer' }}
        >
          清空所有
        </button>

        <div style={{ marginTop: '20px', padding: '15px', background: '#222', borderRadius: '8px', fontSize: '12px' }}>
          <div style={{ color: '#888', marginBottom: '8px' }}>图例</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '20px', height: '3px', background: '#00ffff', marginRight: '8px' }}></div>
            镜面反射
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '20px', height: '3px', background: '#00ff88', marginRight: '8px' }}></div>
            透明折射
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '20px', height: '3px', background: '#ff4444', marginRight: '8px' }}></div>
            完全吸收
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
            <div style={{ width: '12px', height: '12px', background: '#ffcc00', borderRadius: '50%', marginRight: '8px' }}></div>
            光源
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', background: '#ff0000', borderRadius: '50%', marginRight: '8px' }}></div>
            路径逃逸/错误
          </div>
        </div>

        <div style={{ marginTop: '15px', fontSize: '11px', color: '#666' }}>
          <p>💡 可观测现象:</p>
          <ul style={{ paddingLeft: '15px', margin: '5px 0' }}>
            <li>脉冲光点沿光路移动</li>
            <li>反射点能量衰减圆环</li>
            <li>阴影区域灰度渐变</li>
            <li>镜面高光扫描动画</li>
            <li>错误路径红色闪烁</li>
            <li>反射过高性能下降</li>
            <li>浮点误差路径逃逸</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
