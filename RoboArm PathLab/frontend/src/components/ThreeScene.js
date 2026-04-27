import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import RoboticArm from './RoboticArm';
import Obstacles from './Obstacles';
import TargetPoint from './TargetPoint';
import PathPreview from './PathPreview';
import AnimationController from './AnimationController';
import useStore from '../store';

function SceneContent() {
  const { armConfig, jointAngles, targetPoint, obstacles, currentPath, showPathPreview } = useStore();
  const groundRef = useRef();
  
  useFrame((state, delta) => {
    if (groundRef.current) {
      groundRef.current.rotation.y += delta * 0.05;
    }
  });
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={50} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
      />
      
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -10]} intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.2} />
      
      <Environment preset="city" />
      
      <gridHelper 
        args={[20, 20, 0x333333, 0x222222]} 
        position={[0, -0.01, 0]}
      />
      
      <mesh 
        ref={groundRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.2} 
          roughness={0.8}
        />
      </mesh>
      
      <RoboticArm 
        config={armConfig} 
        jointAngles={jointAngles} 
      />
      
      <Obstacles obstacles={obstacles} />
      
      <TargetPoint 
        position={targetPoint.position} 
        radius={targetPoint.radius}
      />
      
      {showPathPreview && currentPath && (
        <PathPreview path={currentPath} />
      )}
      
      <AnimationController />
    </>
  );
}

export default function ThreeScene() {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <SceneContent />
    </Canvas>
  );
}
