import * as THREE from 'three';
import type { Lens } from '@/types/optics';

export const createLensGeometry = (lens: Lens): THREE.BufferGeometry => {
  const { radius1, radius2, thickness, aperture } = lens;
  
  const radialSegments = 64;
  const heightSegments = 1;
  
  const frontRadius = Math.abs(radius1);
  const backRadius = Math.abs(radius2);
  
  const frontIsConvex = radius1 > 0;
  const backIsConvex = radius2 < 0;
  
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  const frontSagitta = frontIsConvex 
    ? frontRadius - Math.sqrt(frontRadius * frontRadius - aperture * aperture)
    : frontRadius - Math.sqrt(frontRadius * frontRadius - aperture * aperture);
  
  const backSagitta = backIsConvex
    ? backRadius - Math.sqrt(backRadius * backRadius - aperture * aperture)
    : backRadius - Math.sqrt(backRadius * backRadius - aperture * aperture);
  
  const frontZ = frontIsConvex ? -frontSagitta : frontSagitta;
  const backZ = thickness + (backIsConvex ? backSagitta : -backSagitta);
  
  const frontCenterZ = frontIsConvex ? frontRadius : -frontRadius;
  const backCenterZ = thickness + (backIsConvex ? -backRadius : backRadius);
  
  for (let i = 0; i <= radialSegments; i++) {
    const theta = (i / radialSegments) * Math.PI * 2;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    
    for (let j = 0; j <= heightSegments; j++) {
      const t = j / heightSegments;
      const r = aperture * (1 - t * 0.01);
      
      const x = r * cosTheta;
      const y = r * sinTheta;
      
      let z: number;
      let normal: THREE.Vector3;
      
      if (i < radialSegments / 2) {
        const distFromAxis = Math.sqrt(x * x + y * y);
        const frontHeight = Math.sqrt(Math.max(0, frontRadius * frontRadius - distFromAxis * distFromAxis));
        z = frontIsConvex 
          ? frontCenterZ - frontHeight
          : frontCenterZ + frontHeight;
        
        normal = new THREE.Vector3(x, y, z - frontCenterZ).normalize();
        if (!frontIsConvex) normal.negate();
      } else {
        const distFromAxis = Math.sqrt(x * x + y * y);
        const backHeight = Math.sqrt(Math.max(0, backRadius * backRadius - distFromAxis * distFromAxis));
        z = backIsConvex
          ? backCenterZ + backHeight
          : backCenterZ - backHeight;
        
        normal = new THREE.Vector3(x, y, z - backCenterZ).normalize();
        if (backIsConvex) normal.negate();
      }
      
      positions.push(x, y, z - thickness / 2);
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(i / radialSegments, t);
    }
  }
  
  for (let i = 0; i < radialSegments; i++) {
    for (let j = 0; j < heightSegments; j++) {
      const a = i * (heightSegments + 1) + j;
      const b = a + heightSegments + 1;
      
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  return geometry;
};

export const createSimpleLensGeometry = (lens: Lens): THREE.BufferGeometry => {
  const { thickness } = lens;
  
  const profile = createLensProfile(lens);
  const geometry = new THREE.LatheGeometry(profile, 64);
  
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (bbox) {
    const centerZ = (bbox.min.z + bbox.max.z) / 2;
    geometry.translate(0, 0, -centerZ);
  }
  
  return geometry;
};

const createLensProfile = (lens: Lens): THREE.Vector2[] => {
  const { radius1, radius2, thickness, aperture } = lens;
  const r1 = Math.abs(radius1);
  const r2 = Math.abs(radius2);
  const frontConvex = radius1 > 0;
  const backConvex = radius2 < 0;
  
  const points: THREE.Vector2[] = [];
  const segments = 48;
  
  const frontSag = r1 - Math.sqrt(Math.max(0, r1 * r1 - aperture * aperture));
  const backSag = r2 - Math.sqrt(Math.max(0, r2 * r2 - aperture * aperture));
  
  const frontCenterZ = frontConvex ? r1 : -r1;
  const backCenterZ = thickness + (backConvex ? -r2 : r2);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = aperture * t;
    const frontHeight = Math.sqrt(Math.max(0, r1 * r1 - y * y));
    const z = frontConvex 
      ? frontCenterZ - frontHeight 
      : frontCenterZ + frontHeight;
    points.push(new THREE.Vector2(z, y));
  }
  
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const y = aperture * t;
    const backHeight = Math.sqrt(Math.max(0, r2 * r2 - y * y));
    const z = backConvex 
      ? backCenterZ + backHeight 
      : backCenterZ - backHeight;
    points.push(new THREE.Vector2(z, y));
  }
  
  return points;
};
