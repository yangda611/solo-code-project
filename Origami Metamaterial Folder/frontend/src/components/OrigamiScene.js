import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function OrigamiPanel({ vertices, face, thickness, foldAngle, color, isInterfering }) {
  const meshRef = useRef();
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    
    face.vertices.forEach((vIdx, i) => {
      const v = vertices[vIdx];
      positions.push(v.x, v.y, thickness / 2);
    });
    
    face.vertices.forEach((vIdx, i) => {
      const v = vertices[vIdx];
      positions.push(v.x, v.y, -thickness / 2);
    });
    
    const indices = [];
    const n = face.vertices.length;
    
    for (let i = 1; i < n - 1; i++) {
      indices.push(0, i, i + 1);
    }
    
    for (let i = 1; i < n - 1; i++) {
      indices.push(n, n + i + 1, n + i);
    }
    
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n;
      indices.push(i, next, n + next);
      indices.push(i, n + next, n + i);
    }
    
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    return geo;
  }, [vertices, face, thickness]);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.02;
      if (isInterfering) {
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={isInterfering ? '#dc3545' : color} 
        transparent 
        opacity={isInterfering ? 0.8 : 0.9}
        metalness={0.3}
        roughness={0.5}
      />
    </mesh>
  );
}

function CreaseLine({ start, end, type, thickness }) {
  const lineRef = useRef();
  
  const points = useMemo(() => {
    return [
      new THREE.Vector3(start.x, start.y, thickness / 2 + 0.01),
      new THREE.Vector3(end.x, end.y, thickness / 2 + 0.01)
    ];
  }, [start, end, thickness]);
  
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);
  
  const color = type === 'mountain' ? '#ff6b6b' : type === 'valley' ? '#4ecdc4' : '#ffffff';
  
  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineBasicMaterial color={color} linewidth={3} />
    </line>
  );
}

function EnergyContour({ landscape, progress }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  if (!landscape || !landscape.length) return null;

  const maxEnergy = Math.max(...landscape.flat().map(p => p.energy));
  const minEnergy = Math.min(...landscape.flat().map(p => p.energy));
  const normalizedProgress = progress * (landscape.length - 1);

  return (
    <group ref={groupRef} position={[0, 0, 3]}>
      {landscape.map((row, i) => (
        row.map((point, j) => {
          const energyRatio = (point.energy - minEnergy) / (maxEnergy - minEnergy + 0.001);
          const hue = 0.6 - energyRatio * 0.6;
          const isNearProgress = Math.abs(i - normalizedProgress) < 2;
          
          return (
            <mesh
              key={`${i}-${j}`}
              position={[
                (point.progress1 - 0.5) * 2,
                (point.progress2 - 0.5) * 2,
                -energyRatio * 0.5
              ]}
            >
              <sphereGeometry args={[isNearProgress ? 0.04 : 0.02, 8, 8]} />
              <meshBasicMaterial color={`hsl(${hue * 360}, 70%, 50%)`} transparent opacity={0.7} />
            </mesh>
          );
        })
      ))}
    </group>
  );
}

function BistableJumpIndicator({ isJumping }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && isJumping) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (!isJumping) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 2]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color="#ffc107" transparent opacity={0.8} />
    </mesh>
  );
}

function OrigamiSceneContent({ 
  pattern, 
  foldProgress, 
  animationType,
  energyLandscape,
  interferences,
  hasDeadlock,
  hasAccidentalJump
}) {
  const { vertices, edges, faces, panelThickness = 0.1 } = pattern;

  const deformedVertices = useMemo(() => {
    if (!vertices) return [];
    
    return vertices.map((v, idx) => {
      const foldOffset = Math.sin(foldProgress * Math.PI) * 0.5;
      const waveOffset = Math.sin(idx * 0.5 + foldProgress * Math.PI * 4) * 0.1;
      
      return {
        x: v.x + (animationType === 'wave' ? waveOffset : 0),
        y: v.y,
        z: (v.z || 0) + foldOffset * (idx % 2 === 0 ? 1 : -1)
      };
    });
  }, [vertices, foldProgress, animationType]);

  const interferingFaceIndices = useMemo(() => {
    const indices = new Set();
    interferences.forEach(inf => {
      indices.add(inf.face1);
      indices.add(inf.face2);
    });
    return indices;
  }, [interferences]);

  if (!vertices || !faces) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4a90d9" />
      </mesh>
    );
  }

  const faceColors = ['#4a90d9', '#67b8de', '#357abd', '#5a9fe9', '#2d5a8a'];

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffd700" />

      <group rotation={[-Math.PI / 4, 0, foldProgress * Math.PI * 0.5]}>
        {faces.map((face, idx) => (
          <OrigamiPanel
            key={idx}
            vertices={deformedVertices}
            face={face}
            thickness={panelThickness}
            foldAngle={foldProgress * Math.PI}
            color={faceColors[idx % faceColors.length]}
            isInterfering={interferingFaceIndices.has(idx)}
          />
        ))}

        {edges.map((edge, idx) => (
          <CreaseLine
            key={idx}
            start={deformedVertices[edge.start]}
            end={deformedVertices[edge.end]}
            type={edge.type}
            thickness={panelThickness}
          />
        ))}
      </group>

      {energyLandscape && (
        <EnergyContour landscape={energyLandscape} progress={foldProgress} />
      )}

      <BistableJumpIndicator isJumping={hasAccidentalJump} />

      <gridHelper args={[10, 10, '#4a90d9', '#1a1a2e']} position={[0, -2, 0]} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
      />
    </>
  );
}

export default function OrigamiScene({ 
  pattern, 
  foldProgress, 
  animationType,
  energyLandscape,
  interferences = [],
  hasDeadlock = false,
  hasAccidentalJump = false
}) {
  return (
    <Canvas
      camera={{ position: [5, 3, 5], fov: 50 }}
      shadows
      style={{ background: 'transparent' }}
    >
      <OrigamiSceneContent
        pattern={pattern}
        foldProgress={foldProgress}
        animationType={animationType}
        energyLandscape={energyLandscape}
        interferences={interferences}
        hasDeadlock={hasDeadlock}
        hasAccidentalJump={hasAccidentalJump}
      />
    </Canvas>
  );
}
