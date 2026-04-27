import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store';

export default function TargetPoint({ position, radius }) {
  const targetRef = useRef();
  const ringsRef = useRef();
  const glowRef = useRef();
  const markerRef = useRef();
  
  const { isReachable, showTargetSnap, showTaskComplete } = useStore();
  
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    if (targetRef.current) {
      const floatY = Math.sin(time * 1.5) * 0.1;
      targetRef.current.position.set(
        position.x,
        position.y + floatY,
        position.z
      );
    }
    
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, index) => {
        const phase = index * (Math.PI / 3);
        ring.rotation.y = time * (0.5 + index * 0.1);
        ring.rotation.x = time * 0.3 + phase;
        
        const scale = 1 + Math.sin(time * 2 + phase) * 0.1;
        ring.scale.set(scale, scale, scale);
      });
    }
    
    if (glowRef.current) {
      const pulse = (Math.sin(time * 3) + 1) / 2;
      glowRef.current.material.opacity = 0.2 + pulse * 0.3;
      glowRef.current.scale.setScalar(1 + pulse * 0.2);
    }
    
    if (markerRef.current) {
      const pulse = (Math.sin(time * 4) + 1) / 2;
      const baseScale = showTargetSnap ? 1.5 : 1;
      markerRef.current.scale.setScalar(baseScale + pulse * 0.2);
      
      if (showTaskComplete) {
        const completePulse = (Math.sin(time * 6) + 1) / 2;
        markerRef.current.scale.setScalar(baseScale + completePulse * 0.5);
      }
    }
  });
  
  const getMarkerColor = () => {
    if (showTaskComplete) return 0x00ff88;
    if (showTargetSnap) return 0x00ffaa;
    if (isReachable === true) return 0x00ff00;
    if (isReachable === false) return 0xff4444;
    return 0xffcc00;
  };
  
  const getGlowColor = () => {
    if (showTaskComplete) return 0x00ff88;
    if (showTargetSnap) return 0x00ffaa;
    if (isReachable === true) return 0x00ff00;
    if (isReachable === false) return 0xff0000;
    return 0xffcc00;
  };
  
  return (
    <group>
      <group ref={targetRef} position={[position.x, position.y, position.z]}>
        <mesh ref={glowRef}>
          <sphereGeometry args={[radius * 2, 32, 32]} />
          <meshBasicMaterial
            color={getGlowColor()}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
        
        <group ref={ringsRef}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <torusGeometry args={[radius * (1.2 + i * 0.3), 0.02, 16, 64]} />
              <meshBasicMaterial
                color={getMarkerColor()}
                transparent
                opacity={0.6 - i * 0.15}
              />
            </mesh>
          ))}
        </group>
        
        <mesh ref={markerRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            color={getMarkerColor()}
            emissive={getMarkerColor()}
            emissiveIntensity={showTaskComplete ? 2 : (showTargetSnap ? 1.5 : 0.8)}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        <mesh position={[0, -position.y - radius, 0]}>
          <circleGeometry args={[radius * 1.5, 64]} />
          <meshBasicMaterial
            color={getMarkerColor()}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        <group position={[0, radius + 0.5, 0]}>
          <mesh>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshBasicMaterial color={getMarkerColor()} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
            <meshBasicMaterial color={getMarkerColor()} transparent opacity={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
