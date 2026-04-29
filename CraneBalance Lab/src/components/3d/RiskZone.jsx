import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';

export default function RiskZone({ physics }) {
  const zoneRef = useRef();
  const innerZoneRef = useRef();
  const pulseRef = useRef();
  
  const animationTime = useCraneStore((state) => state.animationTime);
  
  useFrame(() => {
    if (!physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const isCritical = physics.riskLevel === 'critical';
    
    if (zoneRef.current) {
      const pulse = (Math.sin(animationTime * 3) + 1) / 2;
      const baseOpacity = isDanger ? 0.3 : 0.1;
      const pulseOpacity = isDanger ? pulse * 0.2 : 0;
      zoneRef.current.material.opacity = baseOpacity + pulseOpacity;
      zoneRef.current.material.color.set(
        isCritical ? '#ff0000' : isDanger ? '#ff6600' : '#ffcc00'
      );
    }
    
    if (innerZoneRef.current) {
      const pulse = (Math.sin(animationTime * 5) + 1) / 2;
      innerZoneRef.current.material.opacity = isCritical ? 0.5 + pulse * 0.3 : isDanger ? 0.3 : 0.1;
      innerZoneRef.current.material.color.set(
        isCritical ? '#ff0000' : '#ff3300'
      );
    }
    
    if (pulseRef.current) {
      const scale = 1 + (Math.sin(animationTime * 2) + 1) * 0.1;
      pulseRef.current.scale.setScalar(scale);
      pulseRef.current.material.opacity = isDanger ? (Math.sin(animationTime * 4) + 1) * 0.15 : 0;
    }
  });
  
  if (!physics) return null;
  
  const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
  const radius = physics.riskZoneRadius || 30;
  const innerRadius = radius * 0.6;
  
  return (
    <group>
      <mesh
        ref={zoneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[innerRadius, radius, 64]} />
        <meshStandardMaterial
          color={isDanger ? '#ff3300' : '#ffcc00'}
          transparent
          opacity={0.15}
          side={2}
        />
      </mesh>
      
      <mesh
        ref={innerZoneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
      >
        <circleGeometry args={[innerRadius, 64]} />
        <meshStandardMaterial
          color={isDanger ? '#ff0000' : '#ffaa00'}
          transparent
          opacity={0.1}
          side={2}
        />
      </mesh>
      
      <mesh
        ref={pulseRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[radius - 0.5, radius, 64]} />
        <meshStandardMaterial
          color="#ff0000"
          transparent
          opacity={0}
          side={2}
          emissive="#ff0000"
          emissiveIntensity={1}
        />
      </mesh>
      
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[innerRadius * 0.7, 0.1, 0]}>
              <coneGeometry args={[0.3, 0.6, 4]} rotation={[Math.PI, 0, 0]} />
              <meshStandardMaterial 
                color={isDanger ? '#ff3300' : '#ffaa00'}
                emissive={isDanger ? '#ff3300' : '#ffaa00'}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
