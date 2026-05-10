import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, Color3, Color4, Mesh, VertexBuffer, StandardMaterial, Tools } from '@babylonjs/core';
import './App.css';
import { createAnimations } from './animations';
import { meshUtils } from './meshUtils';
import { api } from './api';

function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const currentMeshRef = useRef(null);
  const meshLevelsRef = useRef([]);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isAnimatingRef = useRef(false);
  const animationTypesRef = useRef({
    growth: true,
    normalPulse: false,
    ripple: false,
    noise: false
  });
  
  const [currentPreset, setCurrentPreset] = useState(null);
  const [subdivisionLevel, setSubdivisionLevel] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showNormals, setShowNormals] = useState(false);
  const [animationTypes, setAnimationTypes] = useState({
    growth: true,
    normalPulse: false,
    ripple: false,
    noise: false
  });
  const [stats, setStats] = useState({ vertices: 0, faces: 0 });

  useEffect(() => {
    animationTypesRef.current = animationTypes;
  }, [animationTypes]);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    engineRef.current = engine;
    
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.08, 1);
    
    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 3, 4, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 20;
    
    const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    
    const light2 = new HemisphericLight('light2', new Vector3(0, -1, 0), scene);
    light2.intensity = 0.3;
    light2.diffuse = new Color3(0.3, 0.3, 0.5);
    
    sceneRef.current = scene;
    
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);

  const loadMesh = useCallback((levelData) => {
    const scene = sceneRef.current;
    if (!scene || !levelData) return;

    if (currentMeshRef.current) {
      currentMeshRef.current.dispose();
      currentMeshRef.current = null;
    }

    try {
      const mesh = meshUtils.createMeshFromData(levelData, scene);
      
      const material = new StandardMaterial('material', scene);
      material.diffuseColor = new Color3(0.7, 0.8, 0.9);
      material.specularColor = new Color3(0.3, 0.3, 0.3);
      material.emissiveColor = new Color3(0.05, 0.05, 0.1);
      material.backFaceCulling = false;
      
      mesh.material = material;
      currentMeshRef.current = mesh;
      
      setStats({
        vertices: levelData.vertices.length,
        faces: levelData.faces.length
      });
      
      return mesh;
    } catch (error) {
      console.error('Error creating mesh:', error);
      return null;
    }
  }, []);

  const animateGrowth = useCallback(async (startIdx, endIdx) => {
    if (startIdx === endIdx || isAnimatingRef.current) return;
    
    setIsAnimating(true);
    isAnimatingRef.current = true;
    
    const step = startIdx < endIdx ? 1 : -1;
    const levels = meshLevelsRef.current;
    
    for (let i = startIdx; step > 0 ? i < endIdx : i > endIdx; i += step) {
      const fromLevel = levels[i];
      const toLevel = levels[i + step];
      
      if (fromLevel && toLevel) {
        await createAnimations.animateSubdivisionGrowth(
          currentMeshRef.current,
          fromLevel,
          toLevel,
          sceneRef.current,
          loadMesh
        );
        
        setSubdivisionLevel(i + step);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsAnimating(false);
    isAnimatingRef.current = false;
  }, [loadMesh]);

  const loadPreset = useCallback(async (presetName) => {
    if (isAnimatingRef.current) return;
    
    try {
      setIsAnimating(true);
      isAnimatingRef.current = true;
      
      console.log('Loading preset:', presetName);
      const data = await api.getPreset(presetName);
      console.log('Preset loaded:', data);
      
      meshLevelsRef.current = data.levels;
      setMaxLevel(data.levels.length - 1);
      setCurrentPreset(presetName);
      setSubdivisionLevel(0);
      
      const mesh = loadMesh(data.levels[0]);
      
      historyIndexRef.current++;
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push({
        preset: presetName,
        level: 0,
        mesh: data.levels[0]
      });
      
      setIsAnimating(false);
      isAnimatingRef.current = false;
      
      if (animationTypesRef.current.growth && data.levels.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
        animateGrowth(0, data.levels.length - 1);
      }
    } catch (error) {
      console.error('Failed to load preset:', error);
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }
  }, [loadMesh, animateGrowth]);

  const handleLevelChange = useCallback((newLevel) => {
    if (newLevel < 0 || newLevel > maxLevel || newLevel === subdivisionLevel) return;
    
    if (animationTypesRef.current.growth && !isAnimatingRef.current) {
      animateGrowth(subdivisionLevel, newLevel);
    } else {
      loadMesh(meshLevelsRef.current[newLevel]);
      setSubdivisionLevel(newLevel);
    }
    
    historyIndexRef.current++;
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({
      preset: currentPreset,
      level: newLevel,
      mesh: meshLevelsRef.current[newLevel]
    });
  }, [maxLevel, subdivisionLevel, animateGrowth, loadMesh, currentPreset]);

  const undo = useCallback(async () => {
    if (historyIndexRef.current <= 0 || isAnimatingRef.current) return;
    
    setIsAnimating(true);
    isAnimatingRef.current = true;
    
    historyIndexRef.current--;
    const prevState = historyRef.current[historyIndexRef.current];
    
    if (prevState && prevState.mesh) {
      await createAnimations.animateMorphTo(
        currentMeshRef.current,
        prevState.mesh,
        sceneRef.current
      );
      loadMesh(prevState.mesh);
      setSubdivisionLevel(prevState.level);
    }
    
    setIsAnimating(false);
    isAnimatingRef.current = false;
  }, [loadMesh]);

  const redo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || isAnimatingRef.current) return;
    
    setIsAnimating(true);
    isAnimatingRef.current = true;
    
    historyIndexRef.current++;
    const nextState = historyRef.current[historyIndexRef.current];
    
    if (nextState && nextState.mesh) {
      await createAnimations.animateMorphTo(
        currentMeshRef.current,
        nextState.mesh,
        sceneRef.current
      );
      loadMesh(nextState.mesh);
      setSubdivisionLevel(nextState.level);
    }
    
    setIsAnimating(false);
    isAnimatingRef.current = false;
  }, [loadMesh]);

  const toggleAnimation = useCallback((type) => {
    setAnimationTypes(prev => {
      const newVal = { ...prev, [type]: !prev[type] };
      
      if (type === 'normalPulse' && newVal.normalPulse) {
        createAnimations.startNormalPulseAnimation(currentMeshRef.current, sceneRef.current);
      } else if (type === 'normalPulse' && !newVal.normalPulse) {
        createAnimations.stopNormalPulseAnimation();
      }
      
      if (type === 'ripple' && newVal.ripple) {
        createAnimations.startRippleAnimation(currentMeshRef.current, sceneRef.current);
      } else if (type === 'ripple' && !newVal.ripple) {
        createAnimations.stopRippleAnimation();
      }
      
      if (type === 'noise' && newVal.noise) {
        createAnimations.startNoiseAnimation(currentMeshRef.current, sceneRef.current);
      } else if (type === 'noise' && !newVal.noise) {
        createAnimations.stopNoiseAnimation();
      }
      
      return newVal;
    });
  }, []);

  const applyProblem = useCallback(async (problemType) => {
    if (isAnimatingRef.current) return;
    
    const currentLevel = meshLevelsRef.current[subdivisionLevel];
    if (!currentLevel) return;
    
    try {
      setIsAnimating(true);
      isAnimatingRef.current = true;
      
      const result = await api.applyProblems(currentLevel.vertices, currentLevel.faces, [problemType]);
      
      const newMeshData = {
        ...currentLevel,
        vertices: result.vertices,
        faces: result.faces,
        normals: result.normals
      };
      
      await createAnimations.animateMorphTo(
        currentMeshRef.current,
        newMeshData,
        sceneRef.current
      );
      
      loadMesh(newMeshData);
      
      meshLevelsRef.current[subdivisionLevel] = newMeshData;
      
      historyIndexRef.current++;
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push({
        preset: currentPreset,
        level: subdivisionLevel,
        mesh: newMeshData
      });
      
      setIsAnimating(false);
      isAnimatingRef.current = false;
    } catch (error) {
      console.error('Failed to apply problem:', error);
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }
  }, [subdivisionLevel, loadMesh, currentPreset]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  useEffect(() => {
    if (currentMeshRef.current && currentMeshRef.current.material) {
      currentMeshRef.current.material.wireframe = showWireframe;
    }
  }, [showWireframe]);

  return (
    <div className="app-container">
      <div className="left-panel">
        <h1 className="title">3D 曲面细分编辑器</h1>
        
        <div className="panel-section">
          <h2 className="section-title">预设模型</h2>
          <div className="preset-buttons">
            <button 
              className={`preset-btn ${currentPreset === 'smoothSphere' ? 'active' : ''}`}
              onClick={() => loadPreset('smoothSphere')}
              disabled={isAnimating}
            >
              光滑球体
            </button>
            <button 
              className={`preset-btn ${currentPreset === 'sharpCreaseRing' ? 'active' : ''}`}
              onClick={() => loadPreset('sharpCreaseRing')}
              disabled={isAnimating}
            >
              尖锐折痕环
            </button>
            <button 
              className={`preset-btn ${currentPreset === 'boundaryNormalError' ? 'active' : ''}`}
              onClick={() => loadPreset('boundaryNormalError')}
              disabled={isAnimating}
            >
              边界错误法线
            </button>
            <button 
              className={`preset-btn ${currentPreset === 'selfIntersecting' ? 'active' : ''}`}
              onClick={() => loadPreset('selfIntersecting')}
              disabled={isAnimating}
            >
              自交折叠面
            </button>
          </div>
        </div>
        
        <div className="panel-section">
          <h2 className="section-title">细分控制</h2>
          <div className="slider-container">
            <label>细分级别: {subdivisionLevel}</label>
            <input
              type="range"
              min="0"
              max={maxLevel}
              value={subdivisionLevel}
              onChange={(e) => handleLevelChange(parseInt(e.target.value))}
              disabled={isAnimating || maxLevel === 0}
            />
            <div className="level-buttons">
              <button 
                onClick={() => handleLevelChange(0)}
                disabled={isAnimating || maxLevel === 0}
              >
                基础
              </button>
              <button 
                onClick={() => handleLevelChange(Math.floor(maxLevel / 2))}
                disabled={isAnimating || maxLevel === 0}
              >
                中级
              </button>
              <button 
                onClick={() => handleLevelChange(maxLevel)}
                disabled={isAnimating || maxLevel === 0}
              >
                最高
              </button>
            </div>
          </div>
        </div>
        
        <div className="panel-section">
          <h2 className="section-title">动画效果</h2>
          <div className="animation-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={animationTypes.growth}
                onChange={() => toggleAnimation('growth')}
              />
              细分生长动画
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={animationTypes.normalPulse}
                onChange={() => toggleAnimation('normalPulse')}
              />
              法线脉冲高亮
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={animationTypes.ripple}
                onChange={() => toggleAnimation('ripple')}
              />
              位移波纹流动
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={animationTypes.noise}
                onChange={() => toggleAnimation('noise')}
              />
              噪声纹理闪烁
            </label>
          </div>
        </div>
        
        <div className="panel-section">
          <h2 className="section-title">问题模拟</h2>
          <div className="problem-buttons">
            <button onClick={() => applyProblem('non-manifold')} disabled={isAnimating}>
              非流形边
            </button>
            <button onClick={() => applyProblem('sharp-tear')} disabled={isAnimating}>
              棱角撕裂
            </button>
            <button onClick={() => applyProblem('explosion')} disabled={isAnimating}>
              爆炸性位移
            </button>
            <button onClick={() => applyProblem('flipped-normal')} disabled={isAnimating}>
              法线翻转黑斑
            </button>
          </div>
        </div>
        
        <div className="panel-section">
          <h2 className="section-title">显示选项</h2>
          <div className="display-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showWireframe}
                onChange={(e) => setShowWireframe(e.target.checked)}
              />
              显示线框
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showNormals}
                onChange={(e) => setShowNormals(e.target.checked)}
              />
              显示法线
            </label>
          </div>
        </div>
        
        <div className="panel-section">
          <h2 className="section-title">历史</h2>
          <div className="history-buttons">
            <button 
              onClick={undo}
              disabled={isAnimating || historyIndexRef.current <= 0}
            >
              ← 撤销
            </button>
            <button 
              onClick={redo}
              disabled={isAnimating || historyIndexRef.current >= historyRef.current.length - 1}
            >
              重做 →
            </button>
          </div>
        </div>
        
        <div className="info-panel">
          {currentPreset ? (
            <>
              <p><strong>当前模型:</strong> {currentPreset}</p>
              <p><strong>顶点数:</strong> {stats.vertices}</p>
              <p><strong>面数:</strong> {stats.faces}</p>
            </>
          ) : (
            <p>请点击上方预设按钮加载模型</p>
          )}
        </div>
      </div>
      
      <div className="viewport">
        <canvas ref={canvasRef} className="babylon-canvas" />
        
        {isAnimating && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>处理中...</p>
          </div>
        )}
        
        <div className="viewport-info">
          <p>左键: 旋转 | 右键: 平移 | 滚轮: 缩放</p>
        </div>
      </div>
    </div>
  );
}

export default App;
