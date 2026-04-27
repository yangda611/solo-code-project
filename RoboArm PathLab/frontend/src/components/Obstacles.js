import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store';

function SphereObstacle({ obstacle, isCollisionSource }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
    
    if (materialRef.current) {
      if (isCollisionSource) {
        const pulse = (Math.sin(state.clock.elapsedTime * 6) + 1) / 2;
        materialRef.current.emissiveIntensity = pulse * 0.6;
      } else {
        materialRef.current.emissiveIntensity = 0.1;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[obstacle.radius, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isCollisionSource ? '#ff3333' : '#cc4444'}
        metalness={0.3}
        roughness={0.7}
        emissive={isCollisionSource ? 0xff0000 : 0x330000}
        emissiveIntensity={isCollisionSource ? 0.5 : 0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function BoxObstacle({ obstacle, isCollisionSource }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const wireframeRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
    
    if (materialRef.current) {
      if (isCollisionSource) {
        const pulse = (Math.sin(state.clock.elapsedTime * 6) + 1) / 2;
        materialRef.current.emissiveIntensity = pulse * 0.6;
      } else {
        materialRef.current.emissiveIntensity = 0.1;
      }
    }
    
    if (wireframeRef.current) {
      wireframeRef.current.visible = isCollisionSource;
    }
  });
  
  return (
    <group position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
        <meshStandardMaterial
          ref={materialRef}
          color={isCollisionSource ? '#ff3333' : '#cc4444'}
          metalness={0.4}
          roughness={0.6}
          emissive={isCollisionSource ? 0xff0000 : 0x330000}
          emissiveIntensity={isCollisionSource ? 0.5 : 0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      
      <lineSegments ref={wireframeRef}>
        <edgesGeometry args={[
          new THREE.BoxGeometry(obstacle.size.x + 0.05, obstacle.size.y + 0.05, obstacle.size.z + 0.05)
        ]} />
        <lineBasicMaterial color="#ffff00" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function CylinderObstacle({ obstacle, isCollisionSource }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      if (isCollisionSource) {
        const pulse = (Math.sin(state.clock.elapsedTime * 6) + 1) / 2;
        materialRef.current.emissiveIntensity = pulse * 0.6;
      } else {
        materialRef.current.emissiveIntensity = 0.1;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[obstacle.radius, obstacle.radius, obstacle.height, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isCollisionSource ? '#ff3333' : '#cc4444'}
        metalness={0.3}
        roughness={0.7}
        emissive={isCollisionSource ? 0xff0000 : 0x330000}
        emissiveIntensity={isCollisionSource ? 0.5 : 0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

export default function Obstacles({ obstacles }) {
  const { collisions } = useStore();
  
  const collisionObstacleIds = new Set(
    collisions.map(c => c.obstacleIndex)
  );
  
  return (
    <group>
      {obstacles.map((obstacle, index) => {
        const isCollisionSource = collisionObstacleIds.has(index);
        
        switch (obstacle.type) {
          case 'sphere':
            return (
              <SphereObstacle
                key={obstacle.id || `obstacle-${index}`}
                obstacle={obstacle}
                isCollisionSource={isCollisionSource}
              />
            );
            
          case 'box':
            return (
              <BoxObstacle
                key={obstacle.id || `obstacle-${index}`}
                obstacle={obstacle}
                isCollisionSource={isCollisionSource}
              />
            );
            
          case 'cylinder':
            return (
              <CylinderObstacle
                key={obstacle.id || `obstacle-${index}`}
                obstacle={obstacle}
                isCollisionSource={isCollisionSource}
              />
            );
            
          default:
            return null;
        }
      })}
    </group>
  );
}
