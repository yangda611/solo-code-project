import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AberrationData } from '@/types/optics';

interface FocalEffectsProps {
  aberrationData: AberrationData;
  animationTime: number;
  isPlaying: boolean;
}

export const FocalEffects = ({ aberrationData, animationTime, isPlaying }: FocalEffectsProps) => {
  return (
    <group>
      {aberrationData.paraxialFocalPoint && (
        <FocalGlow 
          position={aberrationData.paraxialFocalPoint} 
          color="#00f5ff" 
          animationTime={animationTime}
          isPlaying={isPlaying}
          label="近轴焦点"
        />
      )}
      
      {aberrationData.marginalFocalPoint && (
        <FocalGlow 
          position={aberrationData.marginalFocalPoint} 
          color="#ff6b6b" 
          animationTime={animationTime}
          isPlaying={isPlaying}
          label="边缘焦点"
        />
      )}
      
      {aberrationData.redFocalPoint && (
        <FocalGlow 
          position={aberrationData.redFocalPoint} 
          color="#ff3366" 
          animationTime={animationTime}
          isPlaying={isPlaying}
          label="红光焦点"
        />
      )}
      
      {aberrationData.blueFocalPoint && (
        <FocalGlow 
          position={aberrationData.blueFocalPoint} 
          color="#3366ff" 
          animationTime={animationTime}
          isPlaying={isPlaying}
          label="蓝光焦点"
        />
      )}
      
      {Math.abs(aberrationData.sphericalAberration) > 0.01 && (
        <AberrationSpot
          position={aberrationData.paraxialFocalPoint || new THREE.Vector3(0, 0, 10)}
          size={Math.abs(aberrationData.sphericalAberration) * 2}
          animationTime={animationTime}
          isPlaying={isPlaying}
        />
      )}
    </group>
  );
};

interface FocalGlowProps {
  position: THREE.Vector3;
  color: string;
  animationTime: number;
  isPlaying: boolean;
  label?: string;
}

const FocalGlow = ({ position, color, animationTime, isPlaying }: FocalGlowProps) => {
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const { glowGeometry, particleGeometry } = useMemo(() => {
    const glowGeo = new THREE.SphereGeometry(0.15, 32, 32);
    
    const particlePositions: number[] = [];
    const particleSizes: number[] = [];
    
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.1 + Math.random() * 0.3;
      
      particlePositions.push(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      );
      particleSizes.push(0.02 + Math.random() * 0.03);
    }
    
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('size', new THREE.Float32BufferAttribute(particleSizes, 1));
    
    return { glowGeometry: glowGeo, particleGeometry: particleGeo };
  }, []);

  useFrame(() => {
    if (glowRef.current && isPlaying) {
      const scale = 1 + Math.sin(animationTime * 4) * 0.2;
      glowRef.current.scale.setScalar(scale);
      
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(animationTime * 3) * 0.15;
    }
    
    if (particlesRef.current && isPlaying) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const speed = 0.005 + Math.random() * 0.01;
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const len = Math.sqrt(x * x + y * y + z * z);
        
        if (len > 0.4) {
          positions[i] *= 0.3;
          positions[i + 1] *= 0.3;
          positions[i + 2] *= 0.3;
        } else {
          positions[i] += (x / len) * speed;
          positions[i + 1] += (y / len) * speed;
          positions[i + 2] += (z / len) * speed;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={glowRef} geometry={glowGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          color={color}
          size={0.03}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

interface AberrationSpotProps {
  position: THREE.Vector3;
  size: number;
  animationTime: number;
  isPlaying: boolean;
}

const AberrationSpot = ({ position, size, animationTime, isPlaying }: AberrationSpotProps) => {
  const particlesRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const velocities: number[] = [];
    
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size;
      
      positions.push(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        (Math.random() - 0.5) * 0.1
      );
      
      const hue = Math.random() * 0.2 + 0.5;
      const c = new THREE.Color().setHSL(hue, 1, 0.6);
      colors.push(c.r, c.g, c.b);
      
      velocities.push(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        0
      );
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    
    return geo;
  }, [size]);

  useFrame(() => {
    if (particlesRef.current && isPlaying) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particlesRef.current.geometry.attributes.velocity?.array as Float32Array;
      
      if (velocities) {
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] + Math.sin(animationTime * 2 + i) * 0.002;
          positions[i + 1] += velocities[i + 1] + Math.cos(animationTime * 2 + i) * 0.002;
          
          const dist = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2);
          if (dist > size) {
            positions[i] *= 0.3;
            positions[i + 1] *= 0.3;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <points 
      ref={particlesRef} 
      geometry={geometry}
      position={[position.x, position.y, position.z]}
    >
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
