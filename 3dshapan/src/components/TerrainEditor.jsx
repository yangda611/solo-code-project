import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const CustomOrbitControls = (props) => {
  const controlsRef = useRef();
  
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
      };
    }
  }, []);

  return <OrbitControls ref={controlsRef} {...props} />;
};
import TerrainScene from './TerrainScene';
import { 
  TERRAIN_SIZE, 
  TERRAIN_RESOLUTION, 
  createFlatTerrain, 
  applyBrush, 
  generateTerrainPattern,
  simulateWaterFlow,
  WATER_LEVEL
} from '../utils/terrainUtils';
import { saveTerrainData, loadTerrainData, clearTerrainData, hasSavedData } from '../utils/storageUtils';

function BrushIndicator({ brushPosition, brushRadius, brushOperation }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    
    if (brushPosition) {
      meshRef.current.position.set(brushPosition.x, 0.1, brushPosition.z);
      meshRef.current.scale.set(brushRadius * 2, 1, brushRadius * 2);
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  }, [brushPosition, brushRadius]);

  const getColor = () => {
    switch (brushOperation) {
      case 'raise': return '#4ade80';
      case 'lower': return '#f87171';
      case 'flatten': return '#60a5fa';
      case 'smooth': return '#a78bfa';
      default: return '#ffffff';
    }
  };

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.95, 1, 64]} />
      <meshBasicMaterial color={getColor()} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function TerrainInteraction({ 
  heights, 
  onHeightsChange, 
  brushOperation, 
  brushStrength, 
  brushRadius,
  onBrushPositionChange
}) {
  const { camera, raycaster, pointer } = useThree();
  const planeRef = useRef();
  const isDragging = useRef(false);

  const interactionPlane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );

  const getGridPosition = useCallback((event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(interactionPlane.current, intersectionPoint);
    
    if (intersectionPoint) {
      const halfSize = TERRAIN_SIZE / 2;
      const gridX = Math.floor((intersectionPoint.x + halfSize) / TERRAIN_SIZE * TERRAIN_RESOLUTION);
      const gridZ = Math.floor((intersectionPoint.z + halfSize) / TERRAIN_SIZE * TERRAIN_RESOLUTION);
      
      return {
        worldX: intersectionPoint.x,
        worldZ: intersectionPoint.z,
        gridX: Math.max(0, Math.min(TERRAIN_RESOLUTION - 1, gridX)),
        gridZ: Math.max(0, Math.min(TERRAIN_RESOLUTION - 1, gridZ))
      };
    }
    return null;
  }, [camera, raycaster]);

  const applyBrushAtPosition = useCallback((gridX, gridZ) => {
    const result = applyBrush(
      heights,
      gridX,
      gridZ,
      brushStrength,
      brushRadius,
      brushOperation
    );
    onHeightsChange(result.newHeights, result.affectedIndices);
  }, [heights, brushStrength, brushRadius, brushOperation, onHeightsChange]);

  const handlePointerDown = useCallback((event) => {
    if (event.button !== 0) return;
    isDragging.current = true;
    const pos = getGridPosition(event);
    if (pos) {
      applyBrushAtPosition(pos.gridX, pos.gridZ);
      onBrushPositionChange({ x: pos.worldX, z: pos.worldZ });
    }
  }, [getGridPosition, applyBrushAtPosition, onBrushPositionChange]);

  const handlePointerMove = useCallback((event) => {
    const pos = getGridPosition(event);
    if (pos) {
      onBrushPositionChange({ x: pos.worldX, z: pos.worldZ });
      if (isDragging.current) {
        applyBrushAtPosition(pos.gridX, pos.gridZ);
      }
    }
  }, [getGridPosition, applyBrushAtPosition, onBrushPositionChange]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handlePointerLeave = useCallback(() => {
    isDragging.current = false;
    onBrushPositionChange(null);
  }, [onBrushPositionChange]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave]);

  return null;
}

export default function TerrainEditor() {
  const [terrainData, setTerrainData] = useState(() => {
    const saved = loadTerrainData();
    if (saved) {
      return {
        heights: saved.heights,
        water: saved.water,
        resolution: TERRAIN_RESOLUTION
      };
    }
    return createFlatTerrain();
  });

  const [brushOperation, setBrushOperation] = useState('raise');
  const [brushStrength, setBrushStrength] = useState(0.5);
  const [brushRadius, setBrushRadius] = useState(3);
  const [brushPosition, setBrushPosition] = useState(null);
  const [animationTargets, setAnimationTargets] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(() => {
    const saved = loadTerrainData();
    return saved?.timeOfDay || 'day';
  });
  const [terrainMode, setTerrainMode] = useState(() => {
    const saved = loadTerrainData();
    return saved?.terrainMode || 'hills';
  });
  const [isTransitioningDay, setIsTransitioningDay] = useState(false);
  const [waterSimulationEnabled, setWaterSimulationEnabled] = useState(true);

  const handleHeightsChange = useCallback((newHeights, affectedIndices) => {
    setTerrainData(prev => ({ ...prev, heights: newHeights }));
    setAnimationTargets(affectedIndices);
    setIsAnimating(true);
    
    setTimeout(() => {
      setAnimationTargets([]);
      setIsAnimating(false);
    }, 500);
  }, []);

  const handleBrushPositionChange = useCallback((position) => {
    setBrushPosition(position);
  }, []);

  const generateTerrain = useCallback((mode) => {
    const newHeights = generateTerrainPattern(mode);
    const newWater = new Float32Array(TERRAIN_RESOLUTION * TERRAIN_RESOLUTION);
    
    for (let i = 0; i < newHeights.length; i++) {
      if (newHeights[i] <= WATER_LEVEL) {
        newWater[i] = (WATER_LEVEL - newHeights[i]) * 0.5;
      }
    }

    setIsAnimating(true);
    setTerrainMode(mode);
    setTerrainData(prev => ({ ...prev, heights: newHeights, water: newWater }));
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  }, []);

  const resetTerrain = useCallback(() => {
    const flat = createFlatTerrain();
    setIsAnimating(true);
    setTerrainData(flat);
    setTerrainMode('flat');
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  }, []);

  const toggleTimeOfDay = useCallback(() => {
    setIsTransitioningDay(true);
    const newTime = timeOfDay === 'day' ? 'night' : 'day';
    setTimeOfDay(newTime);
    
    setTimeout(() => {
      setIsTransitioningDay(false);
    }, 2000);
  }, [timeOfDay]);

  const addWater = useCallback(() => {
    const newWater = new Float32Array(terrainData.water);
    const center = Math.floor(TERRAIN_RESOLUTION / 2);
    
    for (let z = 0; z < TERRAIN_RESOLUTION; z++) {
      for (let x = 0; x < TERRAIN_RESOLUTION; x++) {
        const idx = z * TERRAIN_RESOLUTION + x;
        const dx = (x - center) / TERRAIN_RESOLUTION * TERRAIN_SIZE;
        const dz = (z - center) / TERRAIN_RESOLUTION * TERRAIN_SIZE;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 5) {
          newWater[idx] = Math.min(2, newWater[idx] + 1);
        }
      }
    }
    
    setTerrainData(prev => ({ ...prev, water: newWater }));
  }, [terrainData.water]);

  useEffect(() => {
    if (!waterSimulationEnabled) return;
    
    const interval = setInterval(() => {
      setTerrainData(prev => {
        const newWater = simulateWaterFlow(prev.water, prev.heights);
        return { ...prev, water: newWater };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [waterSimulationEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      saveTerrainData(terrainData.heights, terrainData.water, terrainMode, timeOfDay);
    }, 5000);

    return () => clearInterval(interval);
  }, [terrainData, terrainMode, timeOfDay]);

  const handleSave = () => {
    if (saveTerrainData(terrainData.heights, terrainData.water, terrainMode, timeOfDay)) {
      alert('地形已保存！');
    } else {
      alert('保存失败！');
    }
  };

  const handleLoad = () => {
    const saved = loadTerrainData();
    if (saved) {
      setTerrainData({
        heights: saved.heights,
        water: saved.water,
        resolution: TERRAIN_RESOLUTION
      });
      setTimeOfDay(saved.timeOfDay);
      setTerrainMode(saved.terrainMode);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      alert('地形已加载！');
    } else {
      alert('没有找到保存的地形数据！');
    }
  };

  const handleClear = () => {
    if (confirm('确定要清除所有保存的数据吗？')) {
      clearTerrainData();
      resetTerrain();
    }
  };

  return (
    <div className="editor-container">
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [30, 25, 30], fov: 50 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={[timeOfDay === 'night' ? '#0a1628' : '#87CEEB']} />
          <fog attach="fog" args={[timeOfDay === 'night' ? '#0a1628' : '#87CEEB', 50, 150]} />
          
          <CustomOrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2.1}
          />
          
          <TerrainScene
            heights={terrainData.heights}
            water={terrainData.water}
            animationTargets={animationTargets}
            isAnimating={isAnimating}
            timeOfDay={timeOfDay}
          />
          
          <BrushIndicator
            brushPosition={brushPosition}
            brushRadius={brushRadius}
            brushOperation={brushOperation}
          />
          
          <TerrainInteraction
            heights={terrainData.heights}
            onHeightsChange={handleHeightsChange}
            brushOperation={brushOperation}
            brushStrength={brushStrength}
            brushRadius={brushRadius}
            onBrushPositionChange={handleBrushPositionChange}
          />
        </Canvas>
      </div>

      <div className="control-panel">
        <h2 className="panel-title">3D 地形编辑器</h2>
        
        <div className="panel-section">
          <h3>编辑工具</h3>
          <div className="tool-buttons">
            <button
              className={`tool-btn ${brushOperation === 'raise' ? 'active' : ''}`}
              onClick={() => setBrushOperation('raise')}
            >
              抬高地形
            </button>
            <button
              className={`tool-btn ${brushOperation === 'lower' ? 'active' : ''}`}
              onClick={() => setBrushOperation('lower')}
            >
              降低地形
            </button>
            <button
              className={`tool-btn ${brushOperation === 'flatten' ? 'active' : ''}`}
              onClick={() => setBrushOperation('flatten')}
            >
              削平地形
            </button>
            <button
              className={`tool-btn ${brushOperation === 'smooth' ? 'active' : ''}`}
              onClick={() => setBrushOperation('smooth')}
            >
              平滑地形
            </button>
          </div>
        </div>

        <div className="panel-section">
          <h3>画笔设置</h3>
          <div className="slider-group">
            <label>强度: {brushStrength.toFixed(1)}</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={brushStrength}
              onChange={(e) => setBrushStrength(parseFloat(e.target.value))}
            />
          </div>
          <div className="slider-group">
            <label>半径: {brushRadius.toFixed(1)}</label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={brushRadius}
              onChange={(e) => setBrushRadius(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="panel-section">
          <h3>地形模式</h3>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${terrainMode === 'hills' ? 'active' : ''}`}
              onClick={() => generateTerrain('hills')}
            >
              丘陵
            </button>
            <button
              className={`mode-btn ${terrainMode === 'mountain' ? 'active' : ''}`}
              onClick={() => generateTerrain('mountain')}
            >
              山地
            </button>
            <button
              className={`mode-btn ${terrainMode === 'river' ? 'active' : ''}`}
              onClick={() => generateTerrain('river')}
            >
              河流
            </button>
            <button
              className={`mode-btn ${terrainMode === 'basin' ? 'active' : ''}`}
              onClick={() => generateTerrain('basin')}
            >
              盆地
            </button>
            <button
              className={`mode-btn ${terrainMode === 'canyon' ? 'active' : ''}`}
              onClick={() => generateTerrain('canyon')}
            >
              峡谷
            </button>
          </div>
          <button className="reset-btn" onClick={resetTerrain}>
            重置为平地
          </button>
        </div>

        <div className="panel-section">
          <h3>环境设置</h3>
          <button
            className={`daynight-btn ${isTransitioningDay ? 'transitioning' : ''}`}
            onClick={toggleTimeOfDay}
          >
            {timeOfDay === 'day' ? '🌞 切换为夜晚' : '🌙 切换为白天'}
          </button>
          
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={waterSimulationEnabled}
                onChange={(e) => setWaterSimulationEnabled(e.target.checked)}
              />
              启用水流模拟
            </label>
          </div>
          <button className="water-btn" onClick={addWater}>
            💧 添加水源
          </button>
        </div>

        <div className="panel-section">
          <h3>数据管理</h3>
          <div className="save-load-buttons">
            <button className="save-btn" onClick={handleSave}>
              💾 保存地形
            </button>
            <button className="load-btn" onClick={handleLoad}>
              📂 加载地形
            </button>
            <button className="clear-btn" onClick={handleClear}>
              🗑️ 清除数据
            </button>
          </div>
          <p className="auto-save-note">
            ✨ 每5秒自动保存到本地存储
          </p>
        </div>

        <div className="panel-section instructions">
          <h3>操作说明</h3>
          <ul>
            <li>🖱️ 左键拖拽: 编辑地形</li>
            <li>🔄 右键拖拽: 旋转视角</li>
            <li>📏 滚轮: 缩放视角</li>
            <li>🖐️ 中键拖拽: 平移视角</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
