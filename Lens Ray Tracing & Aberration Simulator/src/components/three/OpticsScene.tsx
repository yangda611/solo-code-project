import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { LensSystem } from './Lens3D';
import { RaySystem } from './RayPath';
import { FocalEffects } from './FocalEffects';
import { Floor } from './Floor';
import { useOpticsStore } from '@/store/useOpticsStore';
import type { Lens, Ray, AberrationData } from '@/types/optics';

const SceneContent = () => {
  const {
    lenses,
    rays,
    aberrationData,
    objectPoint,
    animationTime,
    isPlaying,
    setAnimationTime,
    calculateRays
  } = useOpticsStore();

  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(-8, 4, 10);
    camera.lookAt(2, 0, 5);
  }, [camera]);

  useFrame((state, delta) => {
    if (isPlaying) {
      setAnimationTime(animationTime + delta);
    }
  });

  useEffect(() => {
    calculateRays();
  }, [lenses, objectPoint, calculateRays]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4488ff" />
      
      <Environment preset="night" />
      
      <Floor />
      
      <OpticalAxis />
      
      <ObjectPoint position={objectPoint} />
      
      <LensSystem lenses={lenses} />
      
      <RaySystem 
        rays={rays} 
        animationTime={animationTime}
        isPlaying={isPlaying}
      />
      
      <FocalEffects 
        aberrationData={aberrationData}
        animationTime={animationTime}
        isPlaying={isPlaying}
      />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        makeDefault
      />
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          luminanceSmoothing={0.9} 
          intensity={1.5}
          mipmapBlur
        />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </>
  );
};

const OpticalAxis = () => {
  const points = [
    new THREE.Vector3(0, 0, -10),
    new THREE.Vector3(0, 0, 30)
  ];
  
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: '#00f5ff',
      transparent: true,
      opacity: 0.3
    });
    return { geometry: geo, material: mat };
  }, []);
  
  return <primitive object={new THREE.Line(geometry, material)} />;
};

const ObjectPoint = ({ position }: { position: THREE.Vector3 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial 
          color="#ffff00" 
          transparent 
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial 
          color="#ffff00" 
          transparent 
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export const OpticsScene = () => {
  return (
    <Canvas
      camera={{ position: [-8, 4, 10], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: 'linear-gradient(to bottom, #0a0a1a, #1a1a3a)' }}
    >
      <SceneContent />
    </Canvas>
  );
};
