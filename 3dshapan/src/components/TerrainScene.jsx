import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TERRAIN_SIZE, TERRAIN_RESOLUTION, WATER_LEVEL, GROUND_HEIGHT, createTerrainGeometry } from '../utils/terrainUtils';

function GroundMesh({ timeOfDay }) {
  const groundSize = TERRAIN_SIZE + 20;
  
  const groundColor = timeOfDay === 'night' ? '#1a1a2e' : '#2d3748';
  const sideColor = timeOfDay === 'night' ? '#0f0f1a' : '#1a202c';

  return (
    <group>
      <mesh position={[0, GROUND_HEIGHT, 0]} receiveShadow>
        <boxGeometry args={[groundSize, 2, groundSize]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh position={[0, GROUND_HEIGHT - 5, 0]}>
        <boxGeometry args={[groundSize, 8, groundSize]} />
        <meshStandardMaterial color={sideColor} roughness={0.95} />
      </mesh>
    </group>
  );
}

function TerrainMesh({ heights, animationTargets, isAnimating }) {
  const meshRef = useRef();
  const geometryRef = useRef();

  const geometry = useMemo(() => {
    const geoData = createTerrainGeometry(heights);
    const geo = new THREE.BufferGeometry();
    
    geo.setAttribute('position', new THREE.BufferAttribute(geoData.vertices, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(geoData.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(geoData.colors, 3));
    geo.setIndex(new THREE.BufferAttribute(geoData.indices, 1));
    
    return geo;
  }, []);

  useEffect(() => {
    if (!geometryRef.current || !animationTargets || animationTargets.length === 0) return;

    const positions = geometryRef.current.attributes.position;
    const colors = geometryRef.current.attributes.color;

    for (const idx of animationTargets) {
      positions.array[idx * 3 + 1] = heights[idx];
      
      const color = getTerrainColor(heights[idx]);
      colors.array[idx * 3] = color.r;
      colors.array[idx * 3 + 1] = color.g;
      colors.array[idx * 3 + 2] = color.b;
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  }, [heights, animationTargets]);

  useFrame((_, delta) => {
    if (!isAnimating || !geometryRef.current) return;
    
    const positions = geometryRef.current.attributes.position;
    const colors = geometryRef.current.attributes.color;
    let needsUpdate = false;

    for (let i = 0; i < heights.length; i++) {
      const currentY = positions.array[i * 3 + 1];
      const targetY = heights[i];
      
      if (Math.abs(targetY - currentY) > 0.01) {
        const lerpAmount = delta * 4;
        positions.array[i * 3 + 1] = THREE.MathUtils.lerp(currentY, targetY, lerpAmount);
        
        const color = getTerrainColor(positions.array[i * 3 + 1]);
        colors.array[i * 3] = color.r;
        colors.array[i * 3 + 1] = color.g;
        colors.array[i * 3 + 2] = color.b;
        
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      geometryRef.current.computeVertexNormals();
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow castShadow>
      <primitive object={geometry} attach="geometry" ref={geometryRef} />
      <meshStandardMaterial
        vertexColors
        flatShading={false}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function WaterMesh({ water, heights, timeOfDay }) {
  const meshRef = useRef();
  const geometryRef = useRef();

  const waterGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_RESOLUTION - 1, TERRAIN_RESOLUTION - 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame((state) => {
    if (!geometryRef.current) return;
    
    const positions = geometryRef.current.attributes.position;
    const time = state.clock.elapsedTime;

    for (let z = 0; z < TERRAIN_RESOLUTION; z++) {
      for (let x = 0; x < TERRAIN_RESOLUTION; x++) {
        const idx = z * TERRAIN_RESOLUTION + x;
        const waterAmount = water[idx];
        const terrainHeight = heights[idx];
        
        if (waterAmount > 0) {
          const waveX = Math.sin(x * 0.3 + time * 1.5) * 0.05;
          const waveZ = Math.cos(z * 0.3 + time * 1.2) * 0.05;
          const baseLevel = Math.max(terrainHeight, WATER_LEVEL) + (waterAmount * 0.5);
          const clampedLevel = Math.max(baseLevel, GROUND_HEIGHT + 0.1);
          positions.array[idx * 3 + 1] = clampedLevel + waveX + waveZ;
        } else {
          positions.array[idx * 3 + 1] = -100;
        }
      }
    }

    positions.needsUpdate = true;
  });

  const waterColor = timeOfDay === 'night' ? '#1a3a5c' : '#4a90c2';
  const waterOpacity = timeOfDay === 'night' ? 0.7 : 0.6;

  return (
    <mesh ref={meshRef} position={[0, 0.01, 0]}>
      <primitive object={waterGeometry} attach="geometry" ref={geometryRef} />
      <meshPhysicalMaterial
        color={waterColor}
        transparent
        opacity={waterOpacity}
        roughness={0.1}
        metalness={0.1}
        transmission={0.9}
        thickness={0.5}
        envMapIntensity={0.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

function SceneLights({ timeOfDay }) {
  const sunLightRef = useRef();
  const ambientLightRef = useRef();

  useEffect(() => {
    if (!sunLightRef.current || !ambientLightRef.current) return;

    const isNight = timeOfDay === 'night';
    
    sunLightRef.current.intensity = isNight ? 0.3 : 1.5;
    sunLightRef.current.color.set(isNight ? '#4a6a9a' : '#ffecd2');
    
    ambientLightRef.current.intensity = isNight ? 0.2 : 0.5;
    ambientLightRef.current.color.set(isNight ? '#1a2a4a' : '#f0f4f8');
    
    const sunAngle = isNight ? Math.PI * 0.8 : Math.PI * 0.25;
    sunLightRef.current.position.set(
      Math.cos(sunAngle) * 30,
      Math.sin(sunAngle) * 40,
      -20
    );
  }, [timeOfDay]);

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} />
      <directionalLight
        ref={sunLightRef}
        position={[20, 40, -20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <hemisphereLight
        intensity={0.3}
        color="#87CEEB"
        groundColor="#8B7355"
      />
    </>
  );
}

function SkyDome({ timeOfDay }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current || !meshRef.current.material) return;
    
    const isNight = timeOfDay === 'night';
    const material = meshRef.current.material;
    
    if (material.uniforms) {
      if (material.uniforms.topColor) {
        material.uniforms.topColor.value.set(isNight ? '#0a1628' : '#87CEEB');
      }
      if (material.uniforms.bottomColor) {
        material.uniforms.bottomColor.value.set(isNight ? '#1a2a4a' : '#E0F6FF');
      }
      if (material.uniforms.offset) {
        material.uniforms.offset.value = isNight ? 0.3 : 0;
      }
    }
  }, [timeOfDay]);

  const skyShader = {
    uniforms: {
      topColor: { value: new THREE.Color(0x87CEEB) },
      bottomColor: { value: new THREE.Color(0xE0F6FF) },
      offset: { value: 0 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `
  };

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]}>
      <sphereGeometry args={[100, 32, 15]} />
      <shaderMaterial
        uniforms={skyShader.uniforms}
        vertexShader={skyShader.vertexShader}
        fragmentShader={skyShader.fragmentShader}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function getTerrainColor(height) {
  if (height < WATER_LEVEL) {
    return { r: 0.1, g: 0.3, b: 0.6 };
  } else if (height < 0) {
    return { r: 0.2, g: 0.5, b: 0.2 };
  } else if (height < 3) {
    return { r: 0.3, g: 0.6, b: 0.2 };
  } else if (height < 6) {
    return { r: 0.4, g: 0.5, b: 0.3 };
  } else if (height < 9) {
    return { r: 0.5, g: 0.45, b: 0.4 };
  } else {
    return { r: 0.9, g: 0.9, b: 0.95 };
  }
}

export default function TerrainScene({ heights, water, animationTargets, isAnimating, timeOfDay }) {
  return (
    <>
      <SceneLights timeOfDay={timeOfDay} />
      <SkyDome timeOfDay={timeOfDay} />
      <GroundMesh timeOfDay={timeOfDay} />
      <TerrainMesh 
        heights={heights} 
        animationTargets={animationTargets}
        isAnimating={isAnimating}
      />
      <WaterMesh 
        water={water} 
        heights={heights}
        timeOfDay={timeOfDay}
      />
      <gridHelper args={[TERRAIN_SIZE, 50, 0x444444, 0x222222]} position={[0, -0.01, 0]} />
    </>
  );
}
