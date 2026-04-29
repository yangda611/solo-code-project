import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';

export default function WindIndicator({ physics }) {
  const particlesRef = useRef();
  const animationTime = useCraneStore((state) => state.animationTime);
  const windLevel = useCraneStore((state) => state.windLevel);
  
  const particleCount = 100;
  const positions = useRef(new Float32Array(particleCount * 3));
  const velocities = useRef(new Float32Array(particleCount * 3));
  const initialized = useRef(false);
  
  if (!initialized.current) {
    for (let i = 0; i < particleCount; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 60;
      positions.current[i * 3 + 1] = Math.random() * 40 + 5;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 60;
      
      velocities.current[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities.current[i * 3 + 1] = Math.random() * 0.1;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    initialized.current = true;
  }
  
  useFrame((state, delta) => {
    if (!particlesRef.current || !physics) return;
    
    const windForce = physics.windForce || 0;
    const windDirection = new THREE.Vector3(1, 0.1, 0.5).normalize();
    
    const positionsAttribute = particlesRef.current.geometry.attributes.position;
    const posArray = positionsAttribute.array;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      posArray[idx] += windDirection.x * windForce * delta * 10;
      posArray[idx + 1] += windDirection.y * windForce * delta * 5;
      posArray[idx + 2] += windDirection.z * windForce * delta * 10;
      
      posArray[idx] += velocities.current[idx] * delta;
      posArray[idx + 1] += velocities.current[idx + 1] * delta;
      posArray[idx + 2] += velocities.current[idx + 2] * delta;
      
      if (posArray[idx] > 30) posArray[idx] = -30;
      if (posArray[idx] < -30) posArray[idx] = 30;
      if (posArray[idx + 1] > 50) posArray[idx + 1] = 5;
      if (posArray[idx + 1] < 5) posArray[idx + 1] = 50;
      if (posArray[idx + 2] > 30) posArray[idx + 2] = -30;
      if (posArray[idx + 2] < -30) posArray[idx + 2] = 30;
    }
    
    positionsAttribute.needsUpdate = true;
    
    const baseOpacity = Math.min(0.8, windForce * 0.2 + 0.1);
    const pulse = (Math.sin(animationTime * 2) + 1) / 2;
    particlesRef.current.material.opacity = baseOpacity + pulse * 0.1;
    particlesRef.current.material.size = Math.max(0.05, 0.1 + windForce * 0.05);
  });
  
  const windStrength = physics?.windForce || 0;
  const showParticles = windStrength > 0.01;
  const particleOpacity = Math.min(0.8, windStrength * 0.2 + 0.1);
  const particleSize = Math.max(0.05, 0.1 + windStrength * 0.05);
  
  return (
    <group>
      {showParticles && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={positions.current}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#aaddff"
            size={particleSize}
            transparent
            opacity={particleOpacity}
            sizeAttenuation
          />
        </points>
      )}
      
      {windLevel > 2 && (
        <group position={[25, 45, 0]}>
          <mesh>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshStandardMaterial
              color={windLevel > 6 ? '#ff6600' : windLevel > 4 ? '#ffaa00' : '#66aaff'}
              emissive={windLevel > 6 ? '#ff6600' : windLevel > 4 ? '#ffaa00' : '#66aaff'}
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {Array.from({ length: windLevel }).map((_, i) => (
            <mesh
              key={i}
              position={[
                1.5 + i * 0.5,
                Math.sin(animationTime * 3 + i) * 0.2,
                0
              ]}
            >
              <boxGeometry args={[0.6, 0.1, 0.3]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
