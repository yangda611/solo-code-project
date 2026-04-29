import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import Tower from './Tower';
import RotatingPlatform from './RotatingPlatform';
import * as THREE from 'three';

export default function Crane() {
  const craneGroupRef = useRef();
  const tiltRef = useRef();
  
  const towerHeight = useCraneStore((state) => state.towerHeight);
  const armLength = useCraneStore((state) => state.armLength);
  const counterweight = useCraneStore((state) => state.counterweight);
  const cargoWeight = useCraneStore((state) => state.cargoWeight);
  const rotationAngle = useCraneStore((state) => state.rotationAngle);
  const physics = useCraneStore((state) => state.physics);
  const animationTime = useCraneStore((state) => state.animationTime);
  
  useFrame(() => {
    if (!tiltRef.current || !physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const targetTiltX = physics.tiltDirection.x * (Math.PI / 180);
    const targetTiltZ = physics.tiltDirection.z * (Math.PI / 180);
    
    const shakeAmplitude = isDanger ? 0.005 : 0;
    const shakeX = Math.sin(animationTime * 15) * shakeAmplitude;
    const shakeY = Math.cos(animationTime * 12) * shakeAmplitude * 0.5;
    const shakeZ = Math.sin(animationTime * 18) * shakeAmplitude;
    
    tiltRef.current.rotation.x = THREE.MathUtils.lerp(
      tiltRef.current.rotation.x,
      targetTiltX + shakeX,
      0.1
    );
    tiltRef.current.rotation.z = THREE.MathUtils.lerp(
      tiltRef.current.rotation.z,
      targetTiltZ + shakeZ,
      0.1
    );
    
    tiltRef.current.position.y = shakeY;
  });
  
  return (
    <group ref={tiltRef}>
      <Tower height={towerHeight} />
      
      <group position={[0, towerHeight - 1.5, 0]}>
        <RotatingPlatform
          armLength={armLength}
          counterweight={counterweight}
          cargoWeight={cargoWeight}
          rotationAngle={rotationAngle}
          towerHeight={towerHeight}
          physics={physics}
        />
      </group>
    </group>
  );
}
