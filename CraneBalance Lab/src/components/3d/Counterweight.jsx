import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';

export default function Counterweight({ weight, physics }) {
  const counterweightRef = useRef();
  const armRef = useRef();
  
  const animationTime = useCraneStore((state) => state.animationTime);
  
  const weightBlocks = Math.min(8, Math.ceil(weight / 2));
  const armLength = 8;
  
  useFrame(() => {
    if (!counterweightRef.current || !armRef.current || !physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const shakeAmplitude = isDanger ? 0.008 : 0;
    
    const baseDeflection = weight * 0.003;
    const dynamicDeflection = baseDeflection + Math.sin(animationTime * 1.5) * baseDeflection * 0.3;
    
    armRef.current.rotation.x = Math.min(0.05, dynamicDeflection * 0.005) +
      Math.sin(animationTime * 7) * shakeAmplitude;
    
    counterweightRef.current.position.y = Math.sin(animationTime * 6) * shakeAmplitude * 5;
  });
  
  return (
    <group>
      <group ref={armRef}>
        <mesh position={[0, 0, -2]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.5, 1.5]} />
          <meshStandardMaterial
            color="#ff6600"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
        
        {Array.from({ length: Math.ceil((armLength - 3) / 2) }).map((_, i) => {
          const zPos = -3 - i * 2 - 1;
          return (
            <group key={i} position={[0, 0, zPos]}>
              <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.4, 1.8]} />
                <meshStandardMaterial
                  color="#ff6600"
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
              
              <mesh position={[0.5, 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.15, 0.5, 1.8]} />
                <meshStandardMaterial
                  color="#cc4400"
                  metalness={0.6}
                  roughness={0.4}
                />
              </mesh>
              <mesh position={[-0.5, 0.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.15, 0.5, 1.8]} />
                <meshStandardMaterial
                  color="#cc4400"
                  metalness={0.6}
                  roughness={0.4}
                />
              </mesh>
              
              <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.2, 0.08, 1.8]} />
                <meshStandardMaterial
                  color="#dd5500"
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
            </group>
          );
        })}
        
        <mesh position={[0, 0, -armLength]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.5, 1]} />
          <meshStandardMaterial
            color="#cc4400"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        
        <group ref={counterweightRef} position={[0, 0, -armLength - 0.8]}>
          <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6, 0.3, 1.6]} />
            <meshStandardMaterial
              color="#666666"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          
          {Array.from({ length: weightBlocks }).map((_, i) => {
            const yPos = -0.3 + i * 0.4;
            const blockWeight = Math.min(2, weight - i * 2);
            const opacity = blockWeight / 2;
            
            return (
              <mesh
                key={i}
                position={[0, yPos + 0.2, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[1.4, 0.38, 1.4]} />
                <meshStandardMaterial
                  color={physics?.riskLevel === 'danger' || physics?.riskLevel === 'critical' 
                    ? '#ff6633' : '#555555'}
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
            );
          })}
          
          <mesh position={[0, -0.5 + weightBlocks * 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.2, 1.5]} />
            <meshStandardMaterial
              color="#444444"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          
          <mesh position={[0, -0.3 + weightBlocks * 0.4, 0]}>
            <boxGeometry args={[1.8, 0.05, 1.8]} />
            <meshStandardMaterial
              color={physics?.riskLevel === 'danger' || physics?.riskLevel === 'critical'
                ? '#ff0000' : '#00ff00'}
              emissive={physics?.riskLevel === 'danger' || physics?.riskLevel === 'critical'
                ? '#ff0000' : '#00ff00'}
              emissiveIntensity={0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
        
        <group position={[0, 1, -5]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial
              color="#444444"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <torusGeometry args={[0.2, 0.05, 8, 16]} />
            <meshStandardMaterial
              color="#888888"
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </group>
      </group>
      
      {weight < 5 && (
        <group position={[0, 1, -armLength - 2]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.5, 0.8, 0.1]} />
            <meshStandardMaterial
              color="#ffff00"
              emissive="#ffff00"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh position={[0, 0, -0.06]}>
            <boxGeometry args={[1.4, 0.7, 0.02]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      )}
    </group>
  );
}
