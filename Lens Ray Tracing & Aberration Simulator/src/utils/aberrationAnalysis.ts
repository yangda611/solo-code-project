import * as THREE from 'three';
import type { Ray, AberrationData } from '@/types/optics';

export const findFocalPoint = (rays: Ray[]): THREE.Vector3 | null => {
  const validRays = rays.filter(r => !r.isTotallyReflected && r.path.length >= 2);
  if (validRays.length === 0) return null;
  
  const intersections: THREE.Vector3[] = [];
  
  for (let i = 0; i < validRays.length; i++) {
    for (let j = i + 1; j < validRays.length; j++) {
      const intersection = findRayIntersection(validRays[i], validRays[j]);
      if (intersection) {
        intersections.push(intersection);
      }
    }
  }
  
  if (intersections.length === 0) return null;
  
  const avgX = intersections.reduce((sum, p) => sum + p.x, 0) / intersections.length;
  const avgY = intersections.reduce((sum, p) => sum + p.y, 0) / intersections.length;
  const avgZ = intersections.reduce((sum, p) => sum + p.z, 0) / intersections.length;
  
  return new THREE.Vector3(avgX, avgY, avgZ);
};

const findRayIntersection = (ray1: Ray, ray2: Ray): THREE.Vector3 | null => {
  if (ray1.path.length < 3 || ray2.path.length < 3) return null;
  
  const lastIdx1 = ray1.path.length - 1;
  const lastIdx2 = ray2.path.length - 1;
  
  const p1 = ray1.path[lastIdx1 - 1];
  const d1 = ray1.path[lastIdx1].clone().sub(p1).normalize();
  
  const p2 = ray2.path[lastIdx2 - 1];
  const d2 = ray2.path[lastIdx2].clone().sub(p2).normalize();
  
  const w = p1.clone().sub(p2);
  const a = d1.dot(d1);
  const b = d1.dot(d2);
  const c = d2.dot(d2);
  const d = d1.dot(w);
  const e = d2.dot(w);
  
  const denom = a * c - b * b;
  if (Math.abs(denom) < 0.0001) return null;
  
  const s = (b * e - c * d) / denom;
  const t = (a * e - b * d) / denom;
  
  if (s > 0 && t > 0) {
    const point1 = p1.clone().add(d1.clone().multiplyScalar(s));
    const point2 = p2.clone().add(d2.clone().multiplyScalar(t));
    const distance = point1.distanceTo(point2);
    
    if (distance < 0.5) {
      return point1.clone().add(point2).multiplyScalar(0.5);
    }
  }
  
  return null;
};

export const calculateSphericalAberration = (rays: Ray[]): {
  sphericalAberration: number;
  paraxialFocalPoint: THREE.Vector3 | null;
  marginalFocalPoint: THREE.Vector3 | null;
} => {
  const paraxialRays = rays.filter(r => {
    const startY = Math.abs(r.origin.y);
    return startY < 0.1 && !r.isTotallyReflected;
  });
  
  const marginalRays = rays.filter(r => {
    const startY = Math.abs(r.origin.y);
    return startY > 0.3 && !r.isTotallyReflected;
  });
  
  const paraxialFocus = findFocalPoint(paraxialRays.length > 0 ? paraxialRays : rays);
  const marginalFocus = findFocalPoint(marginalRays.length > 0 ? marginalRays : rays);
  
  let sphericalAberration = 0;
  if (paraxialFocus && marginalFocus) {
    sphericalAberration = marginalFocus.z - paraxialFocus.z;
  }
  
  return {
    sphericalAberration,
    paraxialFocalPoint: paraxialFocus,
    marginalFocalPoint: marginalFocus
  };
};

export const calculateChromaticAberration = (rays: Ray[]): {
  chromaticAberration: number;
  redFocalPoint: THREE.Vector3 | null;
  blueFocalPoint: THREE.Vector3 | null;
} => {
  const redRays = rays.filter(r => r.wavelength >= 620 && !r.isTotallyReflected);
  const blueRays = rays.filter(r => r.wavelength <= 480 && !r.isTotallyReflected);
  
  const redFocus = findFocalPoint(redRays.length > 0 ? redRays : rays);
  const blueFocus = findFocalPoint(blueRays.length > 0 ? blueRays : rays);
  
  let chromaticAberration = 0;
  if (redFocus && blueFocus) {
    chromaticAberration = Math.abs(redFocus.z - blueFocus.z);
  }
  
  return {
    chromaticAberration,
    redFocalPoint: redFocus,
    blueFocalPoint: blueFocus
  };
};

export const calculateComa = (rays: Ray[]): number => {
  const validRays = rays.filter(r => !r.isTotallyReflected && r.path.length >= 3);
  if (validRays.length < 3) return 0;
  
  const focalPoints: THREE.Vector3[] = [];
  
  for (const ray of validRays) {
    const lastIdx = ray.path.length - 1;
    const p = ray.path[lastIdx - 1];
    const d = ray.path[lastIdx].clone().sub(p).normalize();
    const zTarget = 15;
    
    const t = (zTarget - p.z) / d.z;
    if (t > 0) {
      const focalPoint = p.clone().add(d.clone().multiplyScalar(t));
      focalPoints.push(focalPoint);
    }
  }
  
  if (focalPoints.length < 2) return 0;
  
  const maxY = Math.max(...focalPoints.map(p => p.y));
  const minY = Math.min(...focalPoints.map(p => p.y));
  
  return maxY - minY;
};

export const analyzeAberrations = (rays: Ray[]): AberrationData => {
  const sphericalData = calculateSphericalAberration(rays);
  const chromaticData = calculateChromaticAberration(rays);
  const coma = calculateComa(rays);
  
  return {
    sphericalAberration: sphericalData.sphericalAberration,
    chromaticAberration: chromaticData.chromaticAberration,
    coma,
    paraxialFocalPoint: sphericalData.paraxialFocalPoint,
    marginalFocalPoint: sphericalData.marginalFocalPoint,
    redFocalPoint: chromaticData.redFocalPoint,
    blueFocalPoint: chromaticData.blueFocalPoint
  };
};
