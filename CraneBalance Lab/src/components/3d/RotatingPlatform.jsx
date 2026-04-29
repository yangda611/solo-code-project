import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';
import Arm from './Arm';
import Counterweight from './Counterweight';
import Cabin from './Cabin';

export default function RotatingPlatform({
  armLength,
  counterweight,
  cargoWeight,
  rotationAngle,
  towerHeight,
  physics
}) {
  const platformRef = useRef();
  const rotationRef = useRef();
  const currentAngle = useRef(0);
  
  const animationTime = useCraneStore((state) => state.animationTime);
  
  useFrame((state, delta) => {
    if (!rotationRef.current) return;
    
    const targetAngle = (rotationAngle * Math.PI) / 180;
    const angleDiff = targetAngle - currentAngle.current;
    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
    
    const rotationSpeed = 2;
    const step = normalizedDiff * Math.min(1, rotationSpeed * delta);
    currentAngle.current += step;
    
    rotationRef.current.rotation.y = currentAngle.current;
    
    const isDanger = physics?.riskLevel === 'danger' || physics?.riskLevel === 'critical';
    const shakeAmplitude = isDanger ? 0.003 : 0;
    
    rotationRef.current.rotation.x = Math.sin(animationTime * 10) * shakeAmplitude;
    rotationRef.current.rotation.z = Math.cos(animationTime * 8) * shakeAmplitude;
  });
  
  return (
    <group ref={rotationRef}>
      <mesh
        ref={platformRef}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[2, 2, 0.4, 16]} />
        <meshStandardMaterial
          color="#333333"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      <Cabin />
      
      <Arm
        length={armLength}
        cargoWeight={cargoWeight}
        towerHeight={towerHeight}
        physics={physics}
      />
      
      <Counterweight
        weight={counterweight}
        physics={physics}
      />
      
      <group position={[0, 1, 0]}>
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 1.5,
                0,
                Math.sin(angle) * 1.5
              ]}
              rotation={[Math.PI / 2, angle, 0]}
            >
              <coneGeometry args={[0.1, 0.3, 4]} />
              <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
