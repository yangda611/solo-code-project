import { useMemo } from 'react';
import * as THREE from 'three';

export const FLOOR_Y = -1.99;

export const Floor = () => {
  const { planeGeometry, gridGeometry, gridMaterial, circleGeometry } = useMemo(() => {
    const planeGeo = new THREE.PlaneGeometry(500, 500, 1, 1);
    planeGeo.rotateX(-Math.PI / 2);
    
    const size = 200;
    const divisions = 100;
    const step = size / divisions;
    const halfSize = size / 2;
    
    const vertices: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i <= divisions; i++) {
      const pos = i * step - halfSize;
      const isMainLine = i % 5 === 0;
      
      const color = isMainLine 
        ? new THREE.Color('#3a5a8a') 
        : new THREE.Color('#1a2a4a');
      
      vertices.push(pos, 0, -halfSize, pos, 0, halfSize);
      vertices.push(-halfSize, 0, pos, halfSize, 0, pos);
      
      for (let j = 0; j < 4; j++) {
        colors.push(color.r, color.g, color.b);
      }
    }
    
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    gridGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const gridMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const circleGeo = new THREE.CircleGeometry(15, 64);
    circleGeo.rotateX(-Math.PI / 2);
    
    return { 
      planeGeometry: planeGeo, 
      gridGeometry: gridGeo, 
      gridMaterial: gridMat,
      circleGeometry: circleGeo
    };
  }, []);

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh receiveShadow renderOrder={-1000}>
        <primitive object={planeGeometry} attach="geometry" />
        <meshStandardMaterial
          color="#050810"
          transparent
          opacity={0.95}
          metalness={0.1}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <lineSegments renderOrder={-999}>
        <primitive object={gridGeometry} attach="geometry" />
        <primitive object={gridMaterial} attach="material" />
      </lineSegments>
      
      <mesh position={[0, 0.001, 0]} renderOrder={-998}>
        <primitive object={circleGeometry} attach="geometry" />
        <meshBasicMaterial
          color="#0a1525"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
