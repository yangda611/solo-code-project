import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WaveParams, DEFAULT_WAVE_PARAMS, GRID_SIZE, DT } from './types';
import { WaveSolver } from './utils/WaveSolver';
import { ParticleSystem, StreamlineRenderer, CrestRenderer, SpectrumAnalyzer } from './utils/ParticleSystem';
import { PRESET_SCENES, createDefaultTerrain } from './utils/presets';
import { TerrainEditor } from './components/TerrainEditor';

const STORAGE_KEY = 'wave-simulator-data';

export default function App() {
  const [waveParams, setWaveParams] = useState<WaveParams>(DEFAULT_WAVE_PARAMS);
  const [terrain, setTerrain] = useState<number[][]>(createDefaultTerrain);
  const [isRunning, setIsRunning] = useState(true);
  const [isEditingTerrain, setIsEditingTerrain] = useState(false);
  const [renderMode, setRenderMode] = useState(0);
  const [showParticles, setShowParticles] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [showCrests, setShowCrests] = useState(true);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [simulationTime, setSimulationTime] = useState(0);

  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const solverRef = useRef<WaveSolver | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const streamlineRef = useRef<StreamlineRenderer | null>(null);
  const crestRef = useRef<CrestRenderer | null>(null);
  const spectrumRef = useRef<SpectrumAnalyzer | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.params) setWaveParams(data.params);
        if (data.terrain) setTerrain(data.terrain);
      } catch (e) {
        console.error('Failed to load saved data');
      }
    }
  }, []);

  useEffect(() => {
    const data = {
      params: waveParams,
      terrain: terrain
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [waveParams, terrain]);

  useEffect(() => {
    const canvas = webglCanvasRef.current;
    if (!canvas) return;

    solverRef.current = new WaveSolver(canvas, waveParams);
    solverRef.current.setTerrain(terrain);

    particleSystemRef.current = new ParticleSystem(canvas.width, canvas.height);
    streamlineRef.current = new StreamlineRenderer(canvas.width, canvas.height);
    crestRef.current = new CrestRenderer();
    spectrumRef.current = new SpectrumAnalyzer();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.setTerrain(terrain);
    }
  }, [terrain]);

  useEffect(() => {
    if (solverRef.current) {
      solverRef.current.setParams(waveParams);
    }
  }, [waveParams]);

  const animate = useCallback((time: number) => {
    if (!isRunning) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    const solver = solverRef.current;
    const webglCanvas = webglCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!solver || !webglCanvas || !overlayCanvas) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    for (let i = 0; i < 3; i++) {
      solver.step();
    }

    solver.render(webglCanvas, renderMode);

    const heightData = solver.getHeightData();
    const velocityData = solver.getVelocityData();

    const overlayCtx = overlayCanvas.getContext('2d');
    if (overlayCtx) {
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      if (showCrests && crestRef.current) {
        crestRef.current.update(heightData, waveParams.height * 0.3);
        crestRef.current.render(overlayCtx, overlayCanvas.width, overlayCanvas.height);
      }

      if (showStreamlines && streamlineRef.current) {
        if (Math.random() < 0.1) {
          streamlineRef.current.seedStreamlines(2);
        }

        const getVelocity = (x: number, y: number) => {
          const gx = Math.floor(x);
          const gy = Math.floor(y);
          const idx = (gy * GRID_SIZE + gx) * 4;
          return {
            u: velocityData[idx] || 0,
            v: velocityData[idx + 1] || 0
          };
        };

        streamlineRef.current.advect(getVelocity, DT * 3);
        streamlineRef.current.render(overlayCtx);
      }

      if (showParticles && particleSystemRef.current) {
        const breakingPoints: { x: number; y: number; strength: number }[] = [];

        for (let y = 10; y < GRID_SIZE - 10; y += 5) {
          for (let x = 10; x < GRID_SIZE - 10; x += 5) {
            const idx = (y * GRID_SIZE + x) * 4;
            const slope = velocityData[idx + 2] || 0;
            if (slope > waveParams.breakingThreshold * 0.5) {
              breakingPoints.push({
                x: x / GRID_SIZE,
                y: y / GRID_SIZE,
                strength: slope
              });
            }
          }
        }

        particleSystemRef.current.emitBreakingParticles(breakingPoints);
        particleSystemRef.current.update(DT * 3);
        particleSystemRef.current.render(overlayCtx);
      }

      if (showSpectrum && spectrumRef.current) {
        spectrumRef.current.update(heightData);
        spectrumRef.current.render(
          overlayCtx,
          overlayCanvas.width,
          overlayCanvas.height
        );
      }
    }

    setSimulationTime(solver.getTime());
    animationRef.current = requestAnimationFrame(animate);
  }, [isRunning, renderMode, waveParams, showParticles, showStreamlines, showCrests, showSpectrum]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const loadPreset = (index: number) => {
    const preset = PRESET_SCENES[index];
    setWaveParams(preset.params);
    setTerrain(preset.terrain);
    if (solverRef.current) {
      solverRef.current.reset();
    }
    if (crestRef.current) crestRef.current.clear();
    if (spectrumRef.current) spectrumRef.current.clear();
  };

  const resetSimulation = () => {
    if (solverRef.current) {
      solverRef.current.reset();
    }
    if (crestRef.current) crestRef.current.clear();
    if (spectrumRef.current) spectrumRef.current.clear();
  };

  const handleParamChange = (key: keyof WaveParams, value: number) => {
    setWaveParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        近岸波浪传播变形实时模拟系统
      </h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '520px' }}>
          <div style={{ position: 'relative' }}>
            <canvas
              ref={webglCanvasRef}
              width={512}
              height={512}
              style={{
                border: '2px solid #333',
                borderRadius: '4px',
                display: 'block'
              }}
            />
            <canvas
              ref={overlayCanvasRef}
              width={512}
              height={512}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none'
              }}
            />
          </div>

          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            模拟时间: {simulationTime.toFixed(1)}s | 网格分辨率: {GRID_SIZE}×{GRID_SIZE}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>预设场景</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PRESET_SCENES.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(index)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: '#4a90d9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>波况参数</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>周期 (s):</span>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="0.5"
                  value={waveParams.period}
                  onChange={(e) => handleParamChange('period', Number(e.target.value))}
                  style={{ width: '150px' }}
                />
                <span style={{ width: '40px', textAlign: 'right' }}>{waveParams.period}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>波高 (m):</span>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={waveParams.height}
                  onChange={(e) => handleParamChange('height', Number(e.target.value))}
                  style={{ width: '150px' }}
                />
                <span style={{ width: '40px', textAlign: 'right' }}>{waveParams.height.toFixed(1)}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>入射方向:</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={waveParams.direction}
                  onChange={(e) => handleParamChange('direction', Number(e.target.value))}
                  style={{ width: '150px' }}
                />
                <span style={{ width: '40px', textAlign: 'right' }}>{waveParams.direction.toFixed(1)}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>破碎阈值:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={waveParams.breakingThreshold}
                  onChange={(e) => handleParamChange('breakingThreshold', Number(e.target.value))}
                  style={{ width: '150px' }}
                />
                <span style={{ width: '40px', textAlign: 'right' }}>{waveParams.breakingThreshold.toFixed(2)}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>色散强度:</span>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={waveParams.dispersionStrength}
                  onChange={(e) => handleParamChange('dispersionStrength', Number(e.target.value))}
                  style={{ width: '150px' }}
                />
                <span style={{ width: '40px', textAlign: 'right' }}>{waveParams.dispersionStrength.toFixed(1)}</span>
              </label>
            </div>
          </div>

          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>显示控制</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={renderMode}
                  onChange={(e) => setRenderMode(Number(e.target.value))}
                  style={{ padding: '5px' }}
                >
                  <option value={0}>波面高度云图</option>
                  <option value={1}>速度场</option>
                  <option value={2}>涡量场</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showParticles}
                  onChange={(e) => setShowParticles(e.target.checked)}
                />
                破碎粒子喷溅
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showStreamlines}
                  onChange={(e) => setShowStreamlines(e.target.checked)}
                />
                水质点流线
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showCrests}
                  onChange={(e) => setShowCrests(e.target.checked)}
                />
                波峰线推进
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showSpectrum}
                  onChange={(e) => setShowSpectrum(e.target.checked)}
                />
                波能谱分析
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                background: isRunning ? '#e74c3c' : '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              {isRunning ? '暂停' : '继续'}
            </button>
            <button
              onClick={resetSimulation}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              重置
            </button>
          </div>

          <button
            onClick={() => setIsEditingTerrain(!isEditingTerrain)}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              cursor: 'pointer',
              background: isEditingTerrain ? '#9b59b6' : '#8e44ad',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {isEditingTerrain ? '关闭地形编辑器' : '编辑海底地形'}
          </button>
        </div>
      </div>

      {isEditingTerrain && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>地形编辑器</h3>
          <TerrainEditor
            terrain={terrain}
            onTerrainChange={setTerrain}
            isEditing={isEditingTerrain}
          />
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h4 style={{ marginTop: 0, color: '#856404' }}>数值伪影观察提示:</h4>
        <ul style={{ color: '#856404', margin: 0 }}>
          <li><strong>数值激波伪影:</strong> 在陡峭地形处观察波面的非物理振荡和不连续</li>
          <li><strong>短波相位偏差:</strong> 降低色散强度，观察短波传播速度系统性偏低</li>
          <li><strong>虚假提前破碎:</strong> 调低破碎阈值，波浪在较深水区即发生虚假破碎</li>
          <li><strong>边界驻波堆积:</strong> 在防波堤和狭湾场景，观察边界反射波与入射波干涉形成的驻波</li>
        </ul>
      </div>
    </div>
  );
}
