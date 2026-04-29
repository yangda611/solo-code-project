import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';

export default function Tower({ height }) {
  const towerRef = useRef();
  const platformRef = useRef();
  
  const physics = useCraneStore((state) => state.physics);
  const animationTime = useCraneStore((state) => state.animationTime);
  
  const segmentHeight = 3;
  const segments = Math.ceil(height / segmentHeight);
  
  useFrame(() => {
    if (!physics || !platformRef.current) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const pulse = (Math.sin(animationTime * 3) + 1) / 2;
    
    if (isDanger) {
      platformRef.current.material.emissiveIntensity = pulse * 0.5;
      platformRef.current.material.emissive.set(
        physics.riskLevel === 'critical' ? '#ff0000' : '#ff6600'
      );
    } else {
      platformRef.current.material.emissiveIntensity = 0;
    }
  });
  
  return (
    <group ref={towerRef}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.5, 1, 8]} />
        <meshStandardMaterial
          color="#555555"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      {Array.from({ length: segments }).map((_, i) => {
        const y = 1 + i * segmentHeight + segmentHeight / 2;
        if (y > height - 2) return null;
        
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.4, segmentHeight - 0.2, 0.4]} />
              <meshStandardMaterial
                color="#ff6600"
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
            
            <mesh position={[1.2, 0, 1.2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.1, segmentHeight - 0.2, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[-1.2, 0, 1.2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.1, segmentHeight - 0.2, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[1.2, 0, -1.2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.1, segmentHeight - 0.2, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[-1.2, 0, -1.2]} castShadow receiveShadow>
              <cylinderGeometry args={[0.1, 0.1, segmentHeight - 0.2, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            
            <mesh position={[0, (segmentHeight - 0.2) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.6, 0.15, 2.6]} />
              <meshStandardMaterial
                color="#666666"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            
            <mesh position={[0, (segmentHeight - 0.2) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.7, 0.1, 0.15]} />
              <meshStandardMaterial
                color="#999999"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, (segmentHeight - 0.2) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.15, 0.1, 2.7]} />
              <meshStandardMaterial
                color="#999999"
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}
      
      <mesh
        ref={platformRef}
        position={[0, height - 0.8, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[2.5, 2.5, 0.6, 16]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.8}
          roughness={0.2}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>
      
      <mesh
        position={[0, height - 0.3, 0]}
        rotation={[0, animationTime * 0.5, 0]}
        castShadow
        receiveShadow
      >
        <torusGeometry args={[0.8, 0.1, 8, 16]} />
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}
