import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';
import CargoSystem from './CargoSystem';

export default function Arm({ length, cargoWeight, towerHeight, physics }) {
  const armRef = useRef();
  const animationTime = useCraneStore((state) => state.animationTime);
  
  const segmentLength = 3;
  const segments = Math.ceil(length / segmentLength);
  
  useFrame(() => {
    if (!armRef.current || !physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const shakeAmplitude = isDanger ? 0.005 : 0;
    
    const baseDeflection = length * cargoWeight * 0.002;
    const dynamicDeflection = baseDeflection + Math.sin(animationTime * 2) * baseDeflection * 0.2;
    
    armRef.current.rotation.x = -Math.min(0.1, dynamicDeflection * 0.01) + 
      Math.sin(animationTime * 8) * shakeAmplitude;
    armRef.current.rotation.z = Math.cos(animationTime * 10) * shakeAmplitude;
  });
  
  return (
    <group ref={armRef}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.4, 2]} />
        <meshStandardMaterial
          color="#ff6600"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      {Array.from({ length: segments }).map((_, i) => {
        const zPos = 1 + i * segmentLength + segmentLength / 2;
        if (zPos > length - 0.5) return null;
        
        const isLast = zPos + segmentLength > length - 1;
        const width = isLast ? 0.8 : 1.2;
        const height = isLast ? 0.4 : 0.6;
        
        return (
          <group key={i} position={[0, 0, zPos]}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, height, segmentLength - 0.1]} />
              <meshStandardMaterial
                color="#ff6600"
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>
            
            <mesh position={[width / 2 - 0.05, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.1, height, segmentLength - 0.1]} />
              <meshStandardMaterial
                color="#cc4400"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            <mesh position={[-width / 2 + 0.05, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.1, height, segmentLength - 0.1]} />
              <meshStandardMaterial
                color="#cc4400"
                metalness={0.6}
                roughness={0.4}
              />
            </mesh>
            
            <mesh position={[0, height / 2 + 0.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, 0.1, segmentLength - 0.1]} />
              <meshStandardMaterial
                color="#dd5500"
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>
            
            <mesh position={[width / 2 - 0.03, height / 2 + 0.15, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.03, 0.03, segmentLength, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[-width / 2 + 0.03, height / 2 + 0.15, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.03, 0.03, segmentLength, 8]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            
            {!isLast && (
              <>
                <mesh position={[width / 3, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.05, 0.05, width * 0.5, 8]} />
                  <meshStandardMaterial
                    color="#aa3300"
                    metalness={0.6}
                    roughness={0.4}
                  />
                </mesh>
                <mesh position={[-width / 3, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.05, 0.05, width * 0.5, 8]} />
                  <meshStandardMaterial
                    color="#aa3300"
                    metalness={0.6}
                    roughness={0.4}
                  />
                </mesh>
                
                <mesh position={[0, height + 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.04, 0.04, width * 0.8, 8]} />
                  <meshStandardMaterial
                    color="#666666"
                    metalness={0.8}
                    roughness={0.2}
                  />
                </mesh>
              </>
            )}
          </group>
        );
      })}
      
      <mesh position={[0, 0.5, length]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.5, 0.8]} />
        <meshStandardMaterial
          color="#cc4400"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      <mesh position={[0, 1, length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.4, 8]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      <mesh position={[0, 1.5, length]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.2, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#888888"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <CargoSystem
        armLength={length}
        cargoWeight={cargoWeight}
        towerHeight={towerHeight}
        physics={physics}
      />
      
      {Array.from({ length: 3 }).map((_, i) => {
        const zPos = length * (0.3 + i * 0.25);
        return (
          <group key={i} position={[0, 0.6, zPos]}>
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.6, 0.6, 0.2]} />
              <meshStandardMaterial
                color={i === 0 ? '#ff0000' : i === 1 ? '#ffff00' : '#00ff00'}
                emissive={i === 0 ? '#ff0000' : i === 1 ? '#ffff00' : '#00ff00'}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
