'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store';
import type { GalleryLayout, LightConfig, TourPath, Gallery, Exhibit, Vector3D } from '@/store/types';

interface GalleryRoomProps {
  gallery: Gallery;
}

function GalleryRoom({ gallery }: GalleryRoomProps) {
  const floorColor = '#E8E4DE';
  const wallColor = '#FAFAFA';
  const ceilingColor = '#F5F5F5';

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[gallery.width, gallery.depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.8} />
      </mesh>

      <mesh
        position={[0, gallery.height / 2, -gallery.depth / 2]}
        receiveShadow
      >
        <planeGeometry args={[gallery.width, gallery.height]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        position={[gallery.width / 2, gallery.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[gallery.depth, gallery.height]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        position={[-gallery.width / 2, gallery.height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[gallery.depth, gallery.height]} />
        <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh
        position={[0, gallery.height, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[gallery.width, gallery.depth]} />
        <meshStandardMaterial color={ceilingColor} />
      </mesh>
    </group>
  );
}

interface ExhibitItemProps {
  layout: GalleryLayout;
  exhibit: Exhibit | undefined;
  isSelected: boolean;
  onSelect: () => void;
  animationType: string | null;
}

function ExhibitItem({ layout, exhibit, isSelected, onSelect, animationType }: ExhibitItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startPos = useRef(new THREE.Vector3(
    layout.position.x + 10,
    layout.position.y + 5,
    layout.position.z
  ));
  const targetPos = useRef(new THREE.Vector3(
    layout.position.x,
    layout.position.y,
    layout.position.z
  ));
  const animProgress = useRef(0);

  useEffect(() => {
    if (animationType === 'drag' || animationType === 'transition') {
      animProgress.current = 0;
      startPos.current.copy(new THREE.Vector3(
        layout.position.x + (Math.random() - 0.5) * 5,
        layout.position.y + 3,
        layout.position.z + (Math.random() - 0.5) * 5
      ));
      targetPos.current.copy(new THREE.Vector3(
        layout.position.x,
        layout.position.y,
        layout.position.z
      ));
    }
  }, [animationType, layout.position]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      if (animationType === 'drag' || animationType === 'transition') {
        animProgress.current = Math.min(animProgress.current + delta * 1.5, 1);
        const t = animProgress.current;
        const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        meshRef.current.position.lerpVectors(startPos.current, targetPos.current, easeT);
        meshRef.current.rotation.y = easeT * layout.rotation.y;
      } else {
        meshRef.current.position.set(
          layout.position.x,
          layout.position.y,
          layout.position.z
        );
        meshRef.current.rotation.set(
          layout.rotation.x,
          layout.rotation.y,
          layout.rotation.z
        );
      }

      meshRef.current.scale.set(
        layout.scale.x,
        layout.scale.y,
        layout.scale.z
      );

      if (isSelected) {
        meshRef.current.position.y = layout.position.y + Math.sin(Date.now() * 0.003) * 0.1;
      }
    }
  });

  const color = (exhibit?.metadata?.color as string) || '#888888';
  const shape = (exhibit?.metadata?.shape as string) || 'box';

  const geometry = useMemo(() => {
    switch (exhibit?.type) {
      case 'sculpture':
        if (shape === 'geometric') {
          return new THREE.TorusKnotGeometry(0.5, 0.2, 100, 16);
        }
        if (shape === 'organic') {
          return new THREE.SphereGeometry(0.6, 32, 32);
        }
        return new THREE.ConeGeometry(0.5, 1.5, 8);
      case 'painting':
        const width = ((exhibit.metadata?.width as number) || 2) * 0.5;
        const height = ((exhibit.metadata?.height as number) || 1.5) * 0.5;
        return new THREE.BoxGeometry(width, height, 0.05);
      case 'display_case':
        return new THREE.BoxGeometry(1.5, 1, 0.8);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }, [exhibit]);

  const material = useMemo(() => {
    if (exhibit?.type === 'painting') {
      return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0,
      });
    }
    if (exhibit?.type === 'display_case') {
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.1,
        roughness: 0.2,
        transparent: true,
        opacity: 0.7,
        clearcoat: 0.8,
      });
    }
    const material = shape === 'organic' || shape === 'geometric'
      ? new THREE.MeshStandardMaterial({
          color,
          roughness: 0.3,
          metalness: 0.7,
        })
      : new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.2,
        });
    return material;
  }, [exhibit, color, shape]);

  return (
    <group>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
        castShadow
        receiveShadow
      >
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" />
      </mesh>

      {isSelected && (
        <mesh position={[layout.position.x, layout.position.y, layout.position.z]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

interface SceneLightsProps {
  lights: LightConfig[];
}

function SceneLights({ lights }: SceneLightsProps) {
  const lightIntensities = useRef<Record<string, number>>({});

  useEffect(() => {
    lights.forEach((light) => {
      lightIntensities.current[light.id] = 0;
    });
  }, [lights]);

  return (
    <>
      {lights.map((light) => (
        <LightComponent key={light.id} light={light} />
      ))}
    </>
  );
}

interface LightComponentProps {
  light: LightConfig;
}

function LightComponent({ light }: LightComponentProps) {
  const lightRef = useRef<THREE.Light>(null);
  const targetIntensity = useRef(light.intensity);
  const currentIntensity = useRef(0);

  useEffect(() => {
    targetIntensity.current = light.intensity;
  }, [light.intensity]);

  useFrame((_, delta) => {
    if (lightRef.current) {
      currentIntensity.current += (targetIntensity.current - currentIntensity.current) * delta * 2;
      lightRef.current.intensity = currentIntensity.current;
    }
  });

  const lightProps = {
    color: light.color,
    intensity: 0,
    position: [light.position.x, light.position.y, light.position.z] as [number, number, number],
  };

  switch (light.type) {
    case 'ambient':
      return <ambientLight ref={lightRef as React.Ref<THREE.AmbientLight>} {...lightProps} />;
    
    case 'directional':
      return (
        <group>
          <directionalLight
            ref={lightRef as React.Ref<THREE.DirectionalLight>}
            {...lightProps}
            castShadow
            shadow-mapSize={[2048, 2048]}
            target-position={light.targetPosition ? [light.targetPosition.x, light.targetPosition.y, light.targetPosition.z] : [0, 0, 0]}
          />
          <mesh position={lightProps.position}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color={light.color} />
          </mesh>
        </group>
      );
    
    case 'point':
      return (
        <group>
          <pointLight
            ref={lightRef as React.Ref<THREE.PointLight>}
            {...lightProps}
            distance={light.distance || 20}
            decay={2}
            castShadow
          />
          <mesh position={lightProps.position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={light.color} />
          </mesh>
        </group>
      );
    
    case 'spot':
      return (
        <group>
          <spotLight
            ref={lightRef as React.Ref<THREE.SpotLight>}
            {...lightProps}
            angle={light.angle || 0.5}
            penumbra={light.penumbra || 0.5}
            distance={light.distance || 20}
            castShadow
            target-position={light.targetPosition ? [light.targetPosition.x, light.targetPosition.y, light.targetPosition.z] : [0, 0, 0]}
          />
          <mesh position={lightProps.position}>
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshBasicMaterial color={light.color} />
          </mesh>
        </group>
      );
    
    default:
      return null;
  }
}

interface TourPathVisualizerProps {
  tourPath: TourPath;
  isActive: boolean;
  currentPointIndex: number;
}

function TourPathVisualizer({ tourPath, isActive, currentPointIndex }: TourPathVisualizerProps) {
  const lineRef = useRef<THREE.Line>(null);
  const progressRef = useRef(0);

  useFrame((_, delta) => {
    if (isActive && lineRef.current) {
      progressRef.current += delta * 0.5;
      const material = lineRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.5 + Math.sin(progressRef.current) * 0.3;
    }
  });

  const points = tourPath.points.map((p) => new THREE.Vector3(p.position.x, p.position.y, p.position.z));
  
  if (points.length < 2) return null;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial 
          color={isActive ? '#00FF00' : '#8888FF'} 
          transparent 
          opacity={isActive ? 0.8 : 0.3}
          linewidth={2}
        />
      </line>

      {tourPath.points.map((point, index) => (
        <mesh key={index} position={[point.position.x, point.position.y, point.position.z]}>
          <sphereGeometry args={[index === currentPointIndex ? 0.15 : 0.08, 16, 16]} />
          <meshBasicMaterial color={index === currentPointIndex ? '#00FF00' : '#8888FF'} />
        </mesh>
      ))}
    </group>
  );
}

interface CameraControllerProps {
  tourPath?: TourPath;
  isPlayingTour: boolean;
  onTourComplete: () => void;
}

function CameraController({ tourPath, isPlayingTour, onTourComplete }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const currentPointIndex = useRef(0);
  const pointProgress = useRef(0);
  const isWaiting = useRef(false);
  const waitTimer = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const startRot = useRef(new THREE.Quaternion());
  const tourActive = useRef(false);

  useEffect(() => {
    tourActive.current = isPlayingTour;
    if (isPlayingTour && tourPath && tourPath.points.length > 0) {
      currentPointIndex.current = 0;
      pointProgress.current = 0;
      isWaiting.current = false;
      startPos.current.copy(camera.position);
    }
  }, [isPlayingTour, tourPath, camera.position]);

  useFrame((_, delta) => {
    if (!tourActive.current || !tourPath || tourPath.points.length < 2) return;

    const points = tourPath.points;
    
    if (isWaiting.current) {
      waitTimer.current += delta * 1000;
      if (waitTimer.current >= points[currentPointIndex.current].waitTime) {
        isWaiting.current = false;
        waitTimer.current = 0;
        currentPointIndex.current++;
        
        if (currentPointIndex.current >= points.length) {
          tourActive.current = false;
          onTourComplete();
          return;
        }
        
        startPos.current.copy(camera.position);
        const euler = new THREE.Euler(
          points[currentPointIndex.current - 1].rotation.x,
          points[currentPointIndex.current - 1].rotation.y,
          points[currentPointIndex.current - 1].rotation.z
        );
        startRot.current.setFromEuler(euler);
      }
      return;
    }

    const currentPoint = points[currentPointIndex.current];
    const nextPoint = points[currentPointIndex.current + 1];
    
    if (!nextPoint) {
      isWaiting.current = true;
      return;
    }

    pointProgress.current += delta * 0.8;
    
    if (pointProgress.current >= 1) {
      pointProgress.current = 0;
      isWaiting.current = true;
      
      camera.position.set(
        nextPoint.position.x,
        nextPoint.position.y,
        nextPoint.position.z
      );
      return;
    }

    const t = pointProgress.current;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const fromPos = currentPointIndex.current === 0 ? startPos.current : new THREE.Vector3(
      currentPoint.position.x,
      currentPoint.position.y,
      currentPoint.position.z
    );

    camera.position.lerpVectors(
      fromPos,
      new THREE.Vector3(nextPoint.position.x, nextPoint.position.y, nextPoint.position.z),
      easeT
    );

    const lookAt = new THREE.Vector3(0, 0, 0);
    camera.lookAt(lookAt);
  });

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />;
}

interface ObstructionHighlighterProps {
  isHighlighting: boolean;
}

function ObstructionHighlighter({ isHighlighting }: ObstructionHighlighterProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current && isHighlighting) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    }
  });

  if (!isHighlighting) return null;

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[3, 1, 3]} />
      <meshBasicMaterial color="#FF4444" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface GallerySceneProps {
  gallery: Gallery;
  layout: GalleryLayout[];
  lights: LightConfig[];
  tourPaths: TourPath[];
  exhibits: Exhibit[];
  activeAnimation: string;
  isPlayingTour: boolean;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
}

export function GalleryScene({
  gallery,
  layout,
  lights,
  tourPaths,
  exhibits,
  activeAnimation,
  isPlayingTour,
  selectedItemId,
  onSelectItem,
}: GallerySceneProps) {
  const activeTour = tourPaths[0];

  return (
    <Canvas
      shadows
      camera={{
        position: [0, gallery.height * 0.8, gallery.depth * 0.6],
        fov: 60,
        near: 0.1,
        far: 1000,
      }}
      onClick={() => onSelectItem(null)}
    >
      <color attach="background" args={['#F0F0F0']} />
      <fog attach="fog" args={['#F0F0F0', 20, 50]} />

      <SceneLights lights={lights} />

      <GalleryRoom gallery={gallery} />

      {layout.map((layoutItem) => {
        const exhibit = exhibits.find((e) => e.id === layoutItem.exhibitId);
        return (
          <ExhibitItem
            key={layoutItem.id}
            layout={layoutItem}
            exhibit={exhibit}
            isSelected={selectedItemId === layoutItem.id}
            onSelect={() => onSelectItem(layoutItem.id)}
            animationType={activeAnimation}
          />
        );
      })}

      {tourPaths.map((tour) => (
        <TourPathVisualizer
          key={tour.id}
          tourPath={tour}
          isActive={isPlayingTour && tour.id === activeTour?.id}
          currentPointIndex={0}
        />
      ))}

      <ObstructionHighlighter isHighlighting={gallery.presetType === 'obstructed'} />

      <CameraController
        tourPath={activeTour}
        isPlayingTour={isPlayingTour}
        onTourComplete={() => {
          useAppStore.getState().setPlayingTour(false);
        }}
      />

      <Environment preset="city" />
    </Canvas>
  );
}
