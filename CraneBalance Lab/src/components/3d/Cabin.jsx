import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';

export default function Cabin() {
  const cabinRef = useRef();
  const lightRef = useRef();
  
  const physics = useCraneStore((state) => state.physics);
  const animationTime = useCraneStore((state) => state.animationTime);
  
  useFrame(() => {
    if (!lightRef.current || !physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const pulse = (Math.sin(animationTime * 5) + 1) / 2;
    
    if (isDanger) {
      lightRef.current.material.emissiveIntensity = pulse;
      lightRef.current.material.emissive.set(
        physics.riskLevel === 'critical' ? '#ff0000' : '#ff6600'
      );
    } else {
      lightRef.current.material.emissiveIntensity = 0.3;
      lightRef.current.material.emissive.set('#ffff00');
    }
  });
  
  return (
    <group ref={cabinRef} position={[0, 0.5, -2.5]}>
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <boxGeometry args={[2.5, 2, 2]} />
        <meshStandardMaterial
          color="#336699"
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>
      
      <mesh position={[0, 1.2, 1.01]}>
        <boxGeometry args={[2, 1.2, 0.05]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <mesh position={[1.26, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.5, 1.2, 0.05]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <mesh position={[-1.26, 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.5, 1.2, 0.05]} />
        <meshStandardMaterial
          color="#87CEEB"
          transparent
          opacity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[2.6, 0.2, 2.1]} />
        <meshStandardMaterial
          color="#225588"
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      
      <mesh
        ref={lightRef}
        position={[0, 2.6, 0]}
        castShadow
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <pointLight
        position={[0, 2.6, 0]}
        intensity={1}
        distance={10}
        color="#ffff00"
      />
      
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[2.8, 0.3, 2.3]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      
      <group position={[0, 0.1, -1.5]}>
        <mesh>
          <boxGeometry args={[0.8, 0.15, 0.4]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.4, 0.1, 0]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="#cc3333" />
        </mesh>
        <mesh position={[-0.4, 0.1, 0]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshStandardMaterial color="#33cc33" />
        </mesh>
      </group>
    </group>
  );
}
