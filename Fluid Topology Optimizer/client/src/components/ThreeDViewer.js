import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function ThreeDViewer({ 
  config, 
  boundaries, 
  densityField, 
  isOptimizing 
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const densityMeshRef = useRef(null);
  const boundaryMeshesRef = useRef([]);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  const [viewMode, setViewMode] = useState('density');
  const [showBoundaries, setShowBoundaries] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(
      (config.gridSizeX || 32) * 0.8,
      (config.gridSizeY || 20) * 1.2,
      (config.gridSizeZ || 8) * 1.5
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(
      Math.max(config.gridSizeX || 32, config.gridSizeZ || 8) * 2,
      50,
      0x333366,
      0x222244
    );
    gridHelper.position.set(
      (config.gridSizeX || 32) / 2,
      -1,
      (config.gridSizeZ || 8) / 2
    );
    scene.add(gridHelper);

    const createDomainBox = () => {
      const geometry = new THREE.BoxGeometry(
        config.gridSizeX || 32,
        config.gridSizeY || 20,
        config.gridSizeZ || 8
      );
      const edges = new THREE.EdgesGeometry(geometry);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.3 })
      );
      line.position.set(
        (config.gridSizeX || 32) / 2,
        (config.gridSizeY || 20) / 2,
        (config.gridSizeZ || 8) / 2
      );
      scene.add(line);
    };
    createDomainBox();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016;
      
      controls.update();
      
      if (densityMeshRef.current && densityMeshRef.current.material) {
        densityMeshRef.current.material.opacity = 0.7 + Math.sin(timeRef.current * 2) * 0.2;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    const container = containerRef.current;
    const domElement = renderer.domElement;

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      if (container && domElement && container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [config.gridSizeX, config.gridSizeY, config.gridSizeZ]);

  useEffect(() => {
    if (!sceneRef.current) return;

    boundaryMeshesRef.current.forEach(mesh => sceneRef.current.remove(mesh));
    boundaryMeshesRef.current = [];

    if (!showBoundaries) return;

    const createBoundaryMesh = (boundary, type) => {
      try {
        const geometry = new THREE.BoxGeometry(
          boundary.sx || 2,
          boundary.sy || 2,
          boundary.sz || 2
        );
        let color;
        switch (type) {
          case 'inlet': color = 0x4ecdc4; break;
          case 'outlet': color = 0xffe66d; break;
          case 'solid': color = 0xe94560; break;
          default: color = 0x888888;
        }
        const material = new THREE.MeshStandardMaterial({
          color,
          transparent: true,
          opacity: 0.8,
          emissive: color,
          emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          (boundary.x || 0) + (boundary.sx || 2) / 2,
          (boundary.y || 0) + (boundary.sy || 2) / 2,
          (boundary.z || 0) + (boundary.sz || 2) / 2
        );
        mesh.castShadow = true;
        return mesh;
      } catch (e) {
        console.error('Error creating boundary mesh:', e);
        return null;
      }
    };

    boundaries.inlet?.forEach(b => {
      const mesh = createBoundaryMesh(b, 'inlet');
      if (mesh) {
        sceneRef.current.add(mesh);
        boundaryMeshesRef.current.push(mesh);
      }
    });

    boundaries.outlet?.forEach(b => {
      const mesh = createBoundaryMesh(b, 'outlet');
      if (mesh) {
        sceneRef.current.add(mesh);
        boundaryMeshesRef.current.push(mesh);
      }
    });

    boundaries.solid?.forEach(b => {
      const mesh = createBoundaryMesh(b, 'solid');
      if (mesh) {
        sceneRef.current.add(mesh);
        boundaryMeshesRef.current.push(mesh);
      }
    });
  }, [boundaries, showBoundaries]);

  useEffect(() => {
    if (!sceneRef.current || !densityField || !densityField.length) return;

    if (densityMeshRef.current) {
      sceneRef.current.remove(densityMeshRef.current);
      densityMeshRef.current.geometry?.dispose();
      densityMeshRef.current.material?.dispose();
    }

    try {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const colors = [];

      const colorMap = (value) => {
        const color = new THREE.Color();
        color.setHSL(0.6 - value * 0.6, 0.8, 0.3 + value * 0.3);
        return color;
      };

      densityField.forEach((cell) => {
        const rho = cell.rho || 0;
        if (rho > 0.1) {
          positions.push(
            (cell.x || 0) + 0.5,
            (cell.y || 0) + 0.5,
            (cell.z || 0) + 0.5
          );
          
          const color = colorMap(rho);
          colors.push(color.r, color.g, color.b);
        }
      });

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
      });

      const mesh = new THREE.Points(geometry, material);
      sceneRef.current.add(mesh);
      densityMeshRef.current = mesh;
    } catch (e) {
      console.error('Error creating density mesh:', e);
    }
  }, [densityField, viewMode]);

  return (
    <div className="viewer-container" ref={containerRef}>
      <div className="viewer-overlay">
        <div className="viewer-controls">
          <div className="control-group">
            <label>显示模式</label>
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
              <option value="density">密度场</option>
              <option value="velocity">速度场</option>
              <option value="pressure">压力场</option>
            </select>
          </div>
          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="showBoundaries"
              checked={showBoundaries}
              onChange={(e) => setShowBoundaries(e.target.checked)}
            />
            <label htmlFor="showBoundaries">显示边界</label>
          </div>
        </div>
      </div>
      
      {isOptimizing && densityField && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(22, 33, 62, 0.95)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid #0f3460',
          color: '#fff',
          fontSize: '0.85rem',
          minWidth: '200px'
        }}>
          <div style={{ color: '#4ecdc4', fontWeight: 'bold', marginBottom: '8px', fontSize: '1rem' }}>
            🔄 优化进行中...
          </div>
          <div style={{ color: '#aaa', marginBottom: '4px' }}>
            网格单元: {densityField.length.toLocaleString()}
          </div>
          <div style={{ 
            width: '100%', 
            height: '6px', 
            background: '#16213e', 
            borderRadius: '3px',
            marginTop: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, (densityField.length / 5120) * 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e94560, #4ecdc4)',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(22, 33, 62, 0.95)',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #0f3460',
        display: 'flex',
        gap: '16px',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: '#4ecdc4', 
            borderRadius: '2px',
            boxShadow: '0 0 8px rgba(78, 205, 196, 0.5)'
          }} />
          <span style={{ color: '#aaa' }}>入口</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: '#ffe66d', 
            borderRadius: '2px',
            boxShadow: '0 0 8px rgba(255, 230, 109, 0.5)'
          }} />
          <span style={{ color: '#aaa' }}>出口</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: '#e94560', 
            borderRadius: '2px',
            boxShadow: '0 0 8px rgba(233, 69, 96, 0.5)'
          }} />
          <span style={{ color: '#aaa' }}>固体</span>
        </div>
      </div>

      {!densityField && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '1rem',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <div>加载预设或手动设置边界</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#888' }}>
            然后点击"开始优化"查看拓扑优化结果
          </div>
        </div>
      )}
    </div>
  );
}

export default ThreeDViewer;
