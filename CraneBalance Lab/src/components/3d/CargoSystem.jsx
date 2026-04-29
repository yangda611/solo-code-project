import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCraneStore } from '../../store/craneStore';
import * as THREE from 'three';

export default function CargoSystem({ armLength, cargoWeight, towerHeight, physics }) {
  const hookRef = useRef();
  const cargoRef = useRef();
  const ropeLineRef = useRef();
  
  const animationTime = useCraneStore((state) => state.animationTime);
  
  const ropeSegments = 20;
  const ropeLength = towerHeight * 0.6;
  
  const ropeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(ropeSegments * 3);
    
    for (let i = 0; i < ropeSegments; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -i * (ropeLength / ropeSegments);
      positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [ropeLength, ropeSegments]);
  
  useFrame((state, delta) => {
    if (!hookRef.current || !cargoRef.current || !physics) return;
    
    const isDanger = physics.riskLevel === 'danger' || physics.riskLevel === 'critical';
    const isCritical = physics.riskLevel === 'critical';
    
    const swingAmplitude = physics.swingAmplitude ?? 5;
    const swingSpeed = physics.swingSpeed ?? 1;
    
    const baseAngle = swingAmplitude * (Math.PI / 180);
    const timeOffset = animationTime * swingSpeed;
    
    const swingX = Math.sin(timeOffset) * baseAngle;
    const swingZ = Math.cos(timeOffset * 0.7 + 0.5) * baseAngle * 0.6;
    
    const windX = (physics.windForce || 0) * 0.3;
    const windZ = (physics.windForce || 0) * 0.15;
    
    const totalSwingX = swingX + windX;
    const totalSwingZ = swingZ + windZ;
    
    const cargoY = -ropeLength + Math.sin(timeOffset * 2) * 0.1;
    
    if (ropeLineRef.current) {
      const positions = ropeLineRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < ropeSegments; i++) {
        const t = i / (ropeSegments - 1);
        const easedT = t * t;
        
        const segmentX = totalSwingX * ropeLength * easedT * 0.3;
        const segmentZ = totalSwingZ * ropeLength * easedT * 0.3;
        
        positions[i * 3] = segmentX;
        positions[i * 3 + 1] = -t * ropeLength;
        positions[i * 3 + 2] = segmentZ;
      }
      
      ropeLineRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    const hookX = totalSwingX * ropeLength * 0.3;
    const hookZ = totalSwingZ * ropeLength * 0.3;
    
    hookRef.current.position.set(hookX, -ropeLength + 0.5, hookZ);
    hookRef.current.rotation.z = totalSwingX * 0.3;
    hookRef.current.rotation.x = -totalSwingZ * 0.3;
    
    const cargoX = totalSwingX * ropeLength * 0.35;
    const cargoZ = totalSwingZ * ropeLength * 0.35;
    
    cargoRef.current.position.set(cargoX, cargoY - 0.5, cargoZ);
    cargoRef.current.rotation.z = totalSwingX * 0.5;
    cargoRef.current.rotation.x = -totalSwingZ * 0.5;
    
    const shakeAmplitude = isCritical ? 0.05 : isDanger ? 0.02 : 0;
    if (shakeAmplitude > 0) {
      cargoRef.current.position.x += Math.sin(animationTime * 20) * shakeAmplitude;
      cargoRef.current.position.y += Math.cos(animationTime * 18) * shakeAmplitude * 0.5;
      cargoRef.current.position.z += Math.sin(animationTime * 22) * shakeAmplitude;
    }
  });
  
  const cargoSize = Math.max(0.8, Math.min(3, cargoWeight * 0.4));
  const showCargo = cargoWeight > 0;
  
  return (
    <group position={[0, 1.5, armLength]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 8]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#888888"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      <line ref={ropeLineRef}>
        <primitive object={ropeGeometry} attach="geometry" />
        <lineBasicMaterial
          color="#555555"
          linewidth={2}
        />
      </line>
      
      {Array.from({ length: 4 }).map((_, i) => {
        const offsetX = (i === 1 || i === 2 ? 0.05 : -0.05);
        const offsetZ = (i === 2 || i === 3 ? 0.05 : -0.05);
        return (
          <line key={i} position={[offsetX, 0, offsetZ]}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, 0, -ropeLength, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#666666"
              transparent
              opacity={0.7}
            />
          </line>
        );
      })}
      
      <group ref={hookRef}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} />
          <meshStandardMaterial
            color="#cc9900"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <torusGeometry args={[0.2, 0.06, 8, 32, Math.PI * 0.8]} />
          <meshStandardMaterial
            color="#cc9900"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.15, 0.15]} />
          <meshStandardMaterial
            color="#666666"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
      
      {showCargo && (
        <group ref={cargoRef}>
          <group position={[0, cargoSize * 0.5 + 0.1, 0]}>
            {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z], i) => (
              <line key={i} position={[x, 0, z]}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([0, 0, 0, -x * 0.3, 1, -z * 0.3])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#888888" />
              </line>
            ))}
          </group>
          
          <mesh castShadow receiveShadow>
            <boxGeometry args={[cargoSize, cargoSize, cargoSize]} />
            <meshStandardMaterial
              color={physics?.riskLevel === 'critical' ? '#ff3333' :
                     physics?.riskLevel === 'danger' ? '#ff6633' :
                     physics?.riskLevel === 'warning' ? '#ffaa33' : '#6688aa'}
              metalness={0.3}
              roughness={0.7}
            />
          </mesh>
          
          <mesh position={[0, cargoSize * 0.5 + 0.01, 0]}>
            <boxGeometry args={[cargoSize + 0.02, 0.02, cargoSize + 0.02]} />
            <meshStandardMaterial
              color={cargoWeight > 5 ? '#ff0000' : cargoWeight > 3 ? '#ffaa00' : '#00aa00'}
              transparent
              opacity={0.8}
              emissive={cargoWeight > 5 ? '#ff0000' : cargoWeight > 3 ? '#ffaa00' : '#00aa00'}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          <group position={[0, -cargoSize * 0.6, 0]}>
            {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
              <mesh key={i} position={[x, 0, z]} castShadow receiveShadow>
                <boxGeometry args={[0.3, 0.25, 0.3]} />
                <meshStandardMaterial
                  color="#333333"
                  metalness={0.8}
                  roughness={0.2}
                />
              </mesh>
            ))}
          </group>
          
          <mesh position={[0, 0, cargoSize * 0.51]}>
            <planeGeometry args={[Math.min(cargoSize * 0.8, 2), Math.min(cargoSize * 0.6, 1.5)]} />
            <meshStandardMaterial
              color={cargoWeight > 6 ? '#ff0000' : cargoWeight > 4 ? '#ff6600' : '#0066ff'}
              side={2}
            />
          </mesh>
        </group>
      )}
      
      {!showCargo && (
        <mesh ref={cargoRef}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color="#888888"
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}
