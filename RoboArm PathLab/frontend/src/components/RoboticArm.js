import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useStore from '../store';

function Link({ start, end, radius, color, isColliding, showWarning }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  const { position, rotation, scale } = useMemo(() => {
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const direction = new THREE.Vector3().subVectors(endVec, startVec);
    const length = direction.length();
    
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
    
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    
    return {
      position: midPoint,
      rotation: new THREE.Euler(euler.x, euler.y, euler.z),
      scale: new THREE.Vector3(radius, length / 2, radius)
    };
  }, [start, end, radius]);
  
  const baseColor = color || '#4a90d9';
  const collisionColor = '#ff4444';
  const warningColor = '#ffaa00';
  
  useFrame((state, delta) => {
    if (materialRef.current) {
      if (isColliding) {
        const pulse = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2;
        materialRef.current.emissive.setHex(0xff0000);
        materialRef.current.emissiveIntensity = pulse * 0.5;
      } else if (showWarning) {
        const pulse = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2;
        materialRef.current.emissive.setHex(0xffaa00);
        materialRef.current.emissiveIntensity = pulse * 0.3;
      } else {
        materialRef.current.emissive.setHex(0x000000);
        materialRef.current.emissiveIntensity = 0;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={[scale.x, scale.y, scale.z]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[1, 1, 2, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isColliding ? collisionColor : (showWarning ? warningColor : baseColor)}
        metalness={0.6}
        roughness={0.3}
        emissive={isColliding ? 0xff0000 : (showWarning ? 0xffaa00 : 0x000000)}
        emissiveIntensity={0}
      />
    </mesh>
  );
}

function Joint({ position, radius, angle, index, isColliding }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      const targetRotation = angle;
      if (index % 2 === 0) {
        meshRef.current.rotation.y = targetRotation;
      } else {
        meshRef.current.rotation.x = targetRotation;
      }
    }
    
    if (materialRef.current) {
      if (isColliding) {
        const pulse = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2;
        materialRef.current.emissiveIntensity = pulse * 0.5;
      } else {
        materialRef.current.emissiveIntensity = 0;
      }
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isColliding ? '#ff4444' : '#2d5a87'}
        metalness={0.8}
        roughness={0.2}
        emissive={isColliding ? 0xff0000 : 0x000000}
        emissiveIntensity={0}
      />
    </mesh>
  );
}

function EndEffector({ position, showSnap }) {
  const groupRef = useRef();
  const materialRef = useRef();
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    
    if (materialRef.current && showSnap) {
      const pulse = (Math.sin(state.clock.elapsedTime * 8) + 1) / 2;
      materialRef.current.emissiveIntensity = pulse * 0.8;
    }
  });
  
  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial
          ref={materialRef}
          color={showSnap ? '#00ff88' : '#66ccff'}
          metalness={0.9}
          roughness={0.1}
          emissive={showSnap ? 0x00ff88 : 0x000000}
          emissiveIntensity={0}
        />
      </mesh>
      
      <mesh position={[0.2, 0, 0]}>
        <boxGeometry args={[0.15, 0.05, 0.05]} />
        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
      </mesh>
      
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[0.15, 0.05, 0.05]} />
        <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function calculatePositions(config, angles) {
  const { jointCount, linkLengths, basePosition = { x: 0, y: 0, z: 0 } } = config;
  const positions = [{ ...basePosition }];
  
  let currentPosition = new THREE.Vector3(basePosition.x, basePosition.y, basePosition.z);
  let currentRotation = new THREE.Euler(0, 0, 0);
  
  for (let i = 0; i < jointCount; i++) {
    const angle = angles[i] || 0;
    const length = linkLengths[i] || 1;
    
    if (i % 2 === 0) {
      currentRotation.y += angle;
    } else {
      currentRotation.x += angle;
    }
    
    const direction = new THREE.Vector3(0, 1, 0);
    direction.applyEuler(currentRotation);
    direction.multiplyScalar(length);
    
    currentPosition.add(direction);
    positions.push({
      x: currentPosition.x,
      y: currentPosition.y,
      z: currentPosition.z
    });
  }
  
  return positions;
}

export default function RoboticArm({ config, jointAngles }) {
  const { collisions, showTargetSnap } = useStore();
  
  const positions = calculatePositions(config, jointAngles);
  const linkRadius = config.linkRadius || 0.15;
  const jointRadius = linkRadius * 1.5;
  
  const collidingLinks = new Set();
  const collidingJoints = new Set();
  
  collisions.forEach(collision => {
    collidingLinks.add(collision.linkIndex);
    collidingJoints.add(collision.linkIndex);
    collidingJoints.add(collision.linkIndex + 1);
  });
  
  const links = [];
  const joints = [];
  
  for (let i = 0; i < positions.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];
    const isColliding = collidingLinks.has(i);
    
    links.push(
      <Link
        key={`link-${i}`}
        start={start}
        end={end}
        radius={linkRadius}
        isColliding={isColliding}
        showWarning={!isColliding && collisions.length > 0}
      />
    );
    
    joints.push(
      <Joint
        key={`joint-${i}`}
        position={start}
        radius={jointRadius}
        angle={jointAngles[i] || 0}
        index={i}
        isColliding={collidingJoints.has(i)}
      />
    );
  }
  
  const lastPosition = positions[positions.length - 1];
  joints.push(
    <Joint
      key={`joint-${positions.length - 1}`}
      position={lastPosition}
      radius={jointRadius}
      angle={0}
      index={positions.length - 1}
      isColliding={collidingJoints.has(positions.length - 1)}
    />
  );
  
  return (
    <group>
      {links}
      {joints}
      <EndEffector position={lastPosition} showSnap={showTargetSnap} />
    </group>
  );
}
