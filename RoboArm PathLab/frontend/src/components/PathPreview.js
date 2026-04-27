import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store';

export default function PathPreview({ path }) {
  const lineRef = useRef();
  const pointsRef = useRef();
  const progressRef = useRef();
  
  const { pathProgress } = useStore();
  
  const pathGeometry = useMemo(() => {
    if (!path || path.length === 0) return null;
    
    const points = path.map((step) => {
      const endEffector = step.endEffector;
      return new THREE.Vector3(endEffector.x, endEffector.y, endEffector.z);
    });
    
    const curve = new THREE.CatmullRomCurve3(points);
    
    return {
      points,
      curve
    };
  }, [path]);
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    if (lineRef.current) {
      const pulse = (Math.sin(time * 2) + 1) / 2;
      lineRef.current.material.opacity = 0.5 + pulse * 0.3;
    }
    
    if (pointsRef.current) {
      pointsRef.current.children.forEach((point, index) => {
        const phase = index * 0.1;
        const scale = 0.5 + Math.sin(time * 2 + phase) * 0.3;
        point.scale.setScalar(scale);
        point.material.opacity = 0.3 + Math.sin(time * 2 + phase) * 0.3;
      });
    }
    
    if (progressRef.current && pathGeometry) {
      const currentIndex = Math.floor(pathProgress * (path.length - 1));
      const currentStep = path[currentIndex];
      
      if (currentStep) {
        const endEffector = currentStep.endEffector;
        progressRef.current.position.set(
          endEffector.x,
          endEffector.y,
          endEffector.z
        );
        
        const pulse = (Math.sin(time * 5) + 1) / 2;
        progressRef.current.scale.setScalar(1 + pulse * 0.3);
        progressRef.current.material.emissiveIntensity = pulse * 0.5;
      }
    }
  });
  
  if (!pathGeometry) return null;
  
  const { points, curve } = pathGeometry;
  
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, points.length * 10, 0.02, 8, false]} />
        <meshBasicMaterial
          ref={lineRef}
          color="#00aaff"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      <group ref={pointsRef}>
        {points.map((point, index) => (
          <mesh
            key={`point-${index}`}
            position={[point.x, point.y, point.z]}
          >
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial
              color="#00ffff"
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}
      </group>
      
      <mesh ref={progressRef}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive={0xffaa00}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {path.length > 0 && (
        <>
          <mesh
            position={[
            points[0].x, points[0].y, points[0].z]}
          >
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial
              color="#00ff00"
              emissive={0x00ff00}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          <mesh
            position={[
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].z
          ]}
          >
            <sphereGeometry args={[0.12, 24, 24]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive={0xff0000}
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
