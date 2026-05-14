import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import OrigamiScene from './components/OrigamiScene';

const API_BASE = 'http://localhost:3001/api';

const defaultPattern = {
  name: '默认图案',
  vertices: [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 2, z: 0 },
    { x: 0, y: 2, z: 0 },
    { x: 1, y: 1, z: 0 }
  ],
  edges: [
    { start: 0, end: 1, type: 'mountain' },
    { start: 1, end: 2, type: 'valley' },
    { start: 2, end: 3, type: 'mountain' },
    { start: 3, end: 0, type: 'valley' },
    { start: 0, end: 4, type: 'mountain' },
    { start: 1, end: 4, type: 'valley' },
    { start: 2, end: 4, type: 'mountain' },
    { start: 3, end: 4, type: 'valley' }
  ],
  faces: [
    { vertices: [0, 1, 4] },
    { vertices: [1, 2, 4] },
    { vertices: [2, 3, 4] },
    { vertices: [3, 0, 4] }
  ],
  panelThickness: 0.1
};

function App() {
  const [currentPattern, setCurrentPattern] = useState(defaultPattern);
  const [foldProgress, setFoldProgress] = useState(0);
  const [panelThickness, setPanelThickness] = useState(0.1);
  const [animationType, setAnimationType] = useState('fold');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [kinematicData, setKinematicData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [foldingData, setFoldingData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [hoveredWell, setHoveredWell] = useState(null);
  
  const lastRequestTime = useRef(0);
  const pendingRequest = useRef(false);
  const animationFrameId = useRef(null);

  useEffect(() => {
    loadPreset('miura-ori');
  }, []);

  useEffect(() => {
    if (currentPattern) {
      analyzeKinematic();
      analyzeEnergy();
    }
  }, [currentPattern, panelThickness]);

  useEffect(() => {
    if (currentPattern && foldProgress > 0) {
      throttledAnalyzeFolding();
    }
  }, [foldProgress]);

  useEffect(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    if (isAnimating) {
      let direction = 1;
      let lastUpdateTime = 0;
      const updateInterval = 50;
      
      const animate = (currentTime) => {
        if (currentTime - lastUpdateTime >= updateInterval) {
          setFoldProgress(prev => {
            let newProgress = prev + 0.02 * direction;
            if (newProgress >= 1) {
              newProgress = 1;
              direction = -1;
            } else if (newProgress <= 0) {
              newProgress = 0;
              direction = 1;
            }
            return newProgress;
          });
          lastUpdateTime = currentTime;
        }
        animationFrameId.current = requestAnimationFrame(animate);
      };
      
      animationFrameId.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating]);

  const throttledAnalyzeFolding = useCallback(() => {
    const now = Date.now();
    const throttleInterval = 100;
    
    if (now - lastRequestTime.current < throttleInterval || pendingRequest.current) {
      return;
    }
    
    pendingRequest.current = true;
    lastRequestTime.current = now;
    
    axios.post(`${API_BASE}/analyze/folding`, {
      vertices: currentPattern.vertices,
      edges: currentPattern.edges,
      faces: currentPattern.faces,
      thickness: panelThickness,
      progress: foldProgress
    })
      .then(response => {
        setFoldingData(response.data);
      })
      .catch(error => {
        console.error('折叠分析失败:', error.message);
      })
      .finally(() => {
        pendingRequest.current = false;
      });
  }, [currentPattern, panelThickness, foldProgress]);

  const loadPreset = async (presetName) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/presets/${presetName}`);
      setCurrentPattern(response.data);
      setPanelThickness(response.data.panelThickness || 0.1);
      setFoldingData(null);
    } catch (error) {
      console.error('加载预设失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeKinematic = async () => {
    try {
      const response = await axios.post(`${API_BASE}/analyze/kinematics`, {
        vertices: currentPattern.vertices,
        edges: currentPattern.edges,
        faces: currentPattern.faces,
        thickness: panelThickness
      });
      setKinematicData(response.data);
    } catch (error) {
      console.error('运动学分析失败:', error);
    }
  };

  const analyzeEnergy = async () => {
    try {
      const response = await axios.post(`${API_BASE}/analyze/energy`, {
        vertices: currentPattern.vertices,
        edges: currentPattern.edges,
        faces: currentPattern.faces,
        thickness: panelThickness,
        resolution: 12
      });
      setEnergyData(response.data);
    } catch (error) {
      console.error('能量分析失败:', error);
    }
  };

  const toggleAnimation = (type) => {
    if (animationType === type && isAnimating) {
      setIsAnimating(false);
    } else {
      setAnimationType(type);
      setIsAnimating(true);
    }
  };

  const renderEnergyContours = () => {
    if (!energyData || !energyData.landscape) return null;
    
    const { landscape, wells } = energyData;
    const maxEnergy = Math.max(...landscape.flat().map(p => p.energy));
    
    return (
      <div className="energy-canvas">
        {landscape.map((row, i) => (
          row.map((point, j) => {
            const energyRatio = point.energy / (maxEnergy || 1);
            const y = 100 - energyRatio * 80;
            const x = (i / landscape.length) * 100;
            
            return (
              <div
                key={`contour-${i}-${j}`}
                className="contour-line"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${100 / landscape.length}%`,
                  opacity: 0.3 + energyRatio * 0.5
                }}
              />
            );
          })
        ))}
        
        {wells.map((well, idx) => {
          const x = well.x * 100;
          const y = well.y * 100;
          
          return (
            <div
              key={`well-${idx}`}
              className="well-marker"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setHoveredWell({ ...well, x, y, idx })}
              onMouseLeave={() => setHoveredWell(null)}
            />
          );
        })}
        
        {hoveredWell && (
          <div
            className="well-tooltip"
            style={{
              left: `${hoveredWell.x + 5}%`,
              top: `${hoveredWell.y + 5}%`
            }}
          >
            势阱 {hoveredWell.idx + 1}: {hoveredWell.energy.toFixed(2)} J
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔷 刚性折纸结构运动学与双稳态分析系统</h1>
        <div>当前图案: {currentPattern.name}</div>
      </header>

      <div className="main-content">
        <div className="control-panel">
          <div className="panel-section">
            <h3>预设场景</h3>
            <div className="preset-buttons">
              <button className="preset-btn" onClick={() => loadPreset('miura-ori')}>
                📐 Miura-ori 预设
              </button>
              <button className="preset-btn" onClick={() => loadPreset('waterbomb')}>
                💧 Waterbomb 水弹预设
              </button>
              <button className="preset-btn" onClick={() => loadPreset('randlett-flasher')}>
                ✨ Randlett Flasher 预设
              </button>
              <button className="preset-btn" onClick={() => loadPreset('thick-panel')}>
                📦 厚板兼容性预设
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h3>折叠控制</h3>
            <div className="slider-control">
              <label>折叠进度</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={foldProgress}
                onChange={(e) => setFoldProgress(parseFloat(e.target.value))}
              />
              <div className="value-display">{(foldProgress * 100).toFixed(0)}%</div>
            </div>
            
            <div className="slider-control">
              <label>面板厚度</label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={panelThickness}
                onChange={(e) => {
                  const newThickness = parseFloat(e.target.value);
                  setPanelThickness(newThickness);
                  setCurrentPattern(prev => ({ ...prev, panelThickness: newThickness }));
                }}
              />
              <div className="value-display">{(panelThickness * 100).toFixed(0)}mm</div>
            </div>
          </div>

          <div className="panel-section">
            <h3>动画控制</h3>
            <div className="animation-controls">
              <button
                className={`anim-btn ${animationType === 'fold' && isAnimating ? 'active' : ''}`}
                onClick={() => toggleAnimation('fold')}
              >
                🔄 折叠动画
              </button>
              <button
                className={`anim-btn ${animationType === 'wave' && isAnimating ? 'active' : ''}`}
                onClick={() => toggleAnimation('wave')}
              >
                🌊 变形演示
              </button>
              <button
                className={`anim-btn ${animationType === 'jump' && isAnimating ? 'active' : ''}`}
                onClick={() => toggleAnimation('jump')}
              >
                ⚡ 双稳态跳变
              </button>
              <button
                className={`anim-btn ${animationType === 'lock' && isAnimating ? 'active' : ''}`}
                onClick={() => toggleAnimation('lock')}
              >
                🔒 自锁演示
              </button>
            </div>
          </div>

          <div className="panel-section">
            <h3>状态分析</h3>
            <div className="status-indicators">
              <div className="status-item">
                <span>刚性可折叠</span>
                <span className={`status-badge ${kinematicData?.isRigidFoldable ? 'good' : 'danger'}`}>
                  {kinematicData?.isRigidFoldable ? '是' : '否'}
                </span>
              </div>
              <div className="status-item">
                <span>自由度</span>
                <span className="status-badge good">
                  {kinematicData?.degreesOfFreedom || 0}
                </span>
              </div>
              <div className="status-item">
                <span>双稳态</span>
                <span className={`status-badge ${energyData?.isBistable ? 'good' : 'warning'}`}>
                  {energyData?.isBistable ? '是' : '否'}
                </span>
              </div>
              <div className="status-item">
                <span>势阱数量</span>
                <span className="status-badge good">
                  {energyData?.wells?.length || 0}
                </span>
              </div>
              <div className="status-item">
                <span>厚度干涉</span>
                <span className={`status-badge ${foldingData?.hasInterference ? 'danger' : 'good'}`}>
                  {foldingData?.hasInterference ? `${foldingData.interferences.length}处` : '无'}
                </span>
              </div>
              <div className="status-item">
                <span>死锁构型</span>
                <span className={`status-badge ${foldingData?.hasDeadlock ? 'danger' : 'good'}`}>
                  {foldingData?.hasDeadlock ? '存在' : '无'}
                </span>
              </div>
              <div className="status-item">
                <span>过约束变形</span>
                <span className={`status-badge ${foldingData?.hasOverconstraint ? 'warning' : 'good'}`}>
                  {foldingData?.hasOverconstraint ? '存在' : '无'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="viewport">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <>
              <OrigamiScene
                pattern={currentPattern}
                foldProgress={foldProgress}
                animationType={animationType}
                energyLandscape={energyData?.landscape}
                interferences={foldingData?.interferences || []}
                hasDeadlock={foldingData?.hasDeadlock}
                hasAccidentalJump={energyData?.hasAccidentalJump && animationType === 'jump'}
              />
              
              <div className="info-panel">
                <h4>📊 实时数据</h4>
                <div className="info-item">
                  <span>当前势能:</span>
                  <span>{foldingData?.energy?.toFixed(2) || 0} J</span>
                </div>
                <div className="info-item">
                  <span>顶点数:</span>
                  <span>{currentPattern.vertices.length}</span>
                </div>
                <div className="info-item">
                  <span>折痕数:</span>
                  <span>{currentPattern.edges.length}</span>
                </div>
                <div className="info-item">
                  <span>面板数:</span>
                  <span>{currentPattern.faces.length}</span>
                </div>
                <div className="info-item">
                  <span>干涉严重度:</span>
                  <span>
                    {foldingData?.interferences?.length > 0
                      ? (foldingData.interferences.reduce((sum, i) => sum + i.severity, 0) /
                         foldingData.interferences.length * 100).toFixed(0) + '%'
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="energy-panel">
                <h4>⚡ 势能曲面</h4>
                {renderEnergyContours()}
              </div>

              {foldingData?.hasInterference && <div className="interference-overlay" />}
              
              {foldingData?.hasDeadlock && (
                <div className="deadlock-indicator">
                  ⚠️ 检测到死锁构型！
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
