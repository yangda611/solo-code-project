import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, PerspectiveCamera } from '@react-three/drei';
import { useCraneStore } from '../../store/craneStore';
import Crane from './Crane';
import Ground from './Ground';
import RiskZone from './RiskZone';
import WindIndicator from './WindIndicator';
import { useFrame } from '@react-three/fiber';

function AnimationLoop() {
  const updateAnimationTime = useCraneStore((state) => state.updateAnimationTime);
  
  useFrame((state, delta) => {
    updateAnimationTime(delta);
  });
  
  return null;
}

export default function Scene() {
  const physics = useCraneStore((state) => state.physics);
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera
          makeDefault
          position={[40, 35, 40]}
          fov={50}
        />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={20}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2 - 0.1}
          target={[0, 15, 0]}
        />
        
        <Sky
          distance={450000}
          sunPosition={[100, 50, 100]}
          inclination={0.5}
          azimuth={0.25}
        />
        
        <Environment preset="city" />
        
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 80, 50]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={200}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={80}
          shadow-camera-bottom={-80}
        />
        
        <directionalLight
          position={[-30, 40, -30]}
          intensity={0.3}
        />
        
        <hemisphereLight
          color="#87CEEB"
          groundColor="#362d1f"
          intensity={0.5}
        />
        
        <fog attach="fog" args={['#87CEEB', 80, 200]} />
        
        <AnimationLoop />
        
        <Ground />
        
        <RiskZone physics={physics} />
        
        <WindIndicator physics={physics} />
        
        <Crane />
      </Canvas>
    </div>
  );
}
