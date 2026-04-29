import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';

export default function Ground() {
  const gridRef = useRef();
  const platformRef = useRef();
  
  const physics = useCraneStore((state) => state.physics);
  const animationTime = useCraneStore((state) => state.animationTime);
  
  useFrame(() => {
    if (physics && (physics.riskLevel === 'danger' || physics.riskLevel === 'critical')) {
      const intensity = physics.riskLevel === 'critical' ? 1 : 0.5;
      const pulse = (Math.sin(animationTime * 4) + 1) / 2;
      if (platformRef.current) {
        platformRef.current.material.emissiveIntensity = pulse * intensity;
      }
    } else if (platformRef.current) {
      platformRef.current.material.emissiveIntensity = 0;
    }
  });
  
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#4a5d4a"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      <gridHelper
        ref={gridRef}
        args={[300, 100, '#3a4a3a', '#2a3a2a']}
        position={[0, 0.01, 0]}
      />
      
      <mesh
        ref={platformRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial
          color="#556655"
          roughness={0.7}
          metalness={0.3}
          emissive={physics?.riskLevel === 'critical' ? '#ff3333' : 
                     physics?.riskLevel === 'danger' ? '#ff6633' : '#333333'}
          emissiveIntensity={0}
        />
      </mesh>
      
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        receiveShadow
      >
        <ringGeometry args={[2.5, 3, 32]} />
        <meshStandardMaterial
          color="#ffcc00"
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
      
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        receiveShadow
      >
        <ringGeometry args={[5.5, 6, 32]} />
        <meshStandardMaterial
          color="#ffcc00"
          roughness={0.5}
          metalness={0.5}
        />
      </mesh>
      
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i * Math.PI) / 2;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0, 0.1, -2]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 0.2, 0.8]} />
              <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
