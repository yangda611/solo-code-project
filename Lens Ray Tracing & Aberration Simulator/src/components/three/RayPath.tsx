import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Ray } from '@/types/optics';
import { wavelengthToColor } from '@/utils/opticsMath';

interface RayPathProps {
  ray: Ray;
  animationTime: number;
  isPlaying: boolean;
}

export const RayPath = ({ ray, animationTime, isPlaying }: RayPathProps) => {

  const { lineGeometry, glowGeometry, color } = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const glowPositions: number[] = [];
    
    if (ray.path.length < 2) {
      return {
        lineGeometry: new THREE.BufferGeometry(),
        glowGeometry: new THREE.BufferGeometry(),
        color: wavelengthToColor(ray.wavelength)
      };
    }
    
    for (let i = 0; i < ray.path.length - 1; i++) {
      const start = ray.path[i];
      const end = ray.path[i + 1];
      
      const segmentPoints = createSmoothSegment(start, end, 15);
      points.push(...segmentPoints);
      
      for (const p of segmentPoints) {
        glowPositions.push(p.x, p.y, p.z);
      }
    }
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(glowPositions, 3));
    
    return {
      lineGeometry: lineGeo,
      glowGeometry: glowGeo,
      color: wavelengthToColor(ray.wavelength)
    };
  }, [ray.path, ray.wavelength]);

  const lineObject = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    return new THREE.Line(lineGeometry, material);
  }, [lineGeometry, color]);

  const glowObject = useMemo(() => {
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Points(glowGeometry, material);
  }, [glowGeometry, color]);

  useFrame(() => {
    if (isPlaying) {
      const progress = Math.sin(animationTime * 2) * 0.5 + 0.5;
      (lineObject.material as THREE.LineBasicMaterial).opacity = 0.3 + progress * 0.7;
      const pulse = Math.sin(animationTime * 3) * 0.3 + 0.7;
      (glowObject.material as THREE.PointsMaterial).opacity = 0.4 * pulse;
    }
  });

  if (ray.isTotallyReflected) {
    return <TotalReflectionRay ray={ray} animationTime={animationTime} isPlaying={isPlaying} />;
  }

  return (
    <group>
      <primitive object={lineObject} />
      <primitive object={glowObject} />
    </group>
  );
};

const TotalReflectionRay = ({ ray, animationTime, isPlaying }: RayPathProps) => {
  const reflectionPoint = ray.totalReflectionPoint || ray.path[ray.path.length - 1];
  
  const { particleGeometry, lineObject, color } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 0.1 + Math.random() * 0.2;
      positions.push(
        reflectionPoint.x + Math.cos(angle) * radius,
        reflectionPoint.y + Math.sin(angle) * radius,
        reflectionPoint.z + (Math.random() - 0.5) * 0.2
      );
      
      const c = wavelengthToColor(ray.wavelength);
      colors.push(c.r, c.g, c.b);
    }
    
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const linePoints = ray.path.slice(0, ray.path.findIndex(p => 
      ray.totalReflectionPoint && p.distanceTo(ray.totalReflectionPoint) < 0.1
    ) + 1 || ray.path.length);
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: wavelengthToColor(ray.wavelength),
      transparent: true,
      opacity: 0.9
    });
    const lineObj = new THREE.Line(lineGeo, lineMat);
    
    return { 
      particleGeometry: particleGeo, 
      lineObject: lineObj,
      color: wavelengthToColor(ray.wavelength) 
    };
  }, [ray, reflectionPoint]);

  const particleObject = useMemo(() => {
    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    return new THREE.Points(particleGeometry, material);
  }, [particleGeometry]);

  useFrame(() => {
    if (isPlaying) {
      const positions = particleObject.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += 0.02;
        if (positions[i + 2] > 30) {
          positions[i] = reflectionPoint.x + (Math.random() - 0.5) * 0.3;
          positions[i + 1] = reflectionPoint.y + (Math.random() - 0.5) * 0.3;
          positions[i + 2] = reflectionPoint.z;
        }
      }
      particleObject.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      <primitive object={lineObject} />
      <primitive object={particleObject} />
    </group>
  );
};

const createSmoothSegment = (start: THREE.Vector3, end: THREE.Vector3, segments: number): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(new THREE.Vector3(
      start.x + (end.x - start.x) * t,
      start.y + (end.y - start.y) * t,
      start.z + (end.z - start.z) * t
    ));
  }
  return points;
};

export const RaySystem = ({ rays, animationTime, isPlaying }: { 
  rays: Ray[]; 
  animationTime: number;
  isPlaying: boolean;
}) => {
  return (
    <group>
      {rays.map((ray) => (
        <RayPath 
          key={ray.id} 
          ray={ray} 
          animationTime={animationTime}
          isPlaying={isPlaying}
        />
      ))}
    </group>
  );
};
