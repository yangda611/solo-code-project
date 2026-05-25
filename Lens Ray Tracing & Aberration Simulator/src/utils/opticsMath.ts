import * as THREE from 'three';
import type { Lens, Ray, RaySegment, SphereSurface } from '@/types/optics';

export const FLOOR_Y = -1.99;

export const intersectRayFloor = (
  origin: THREE.Vector3,
  direction: THREE.Vector3
): { point: THREE.Vector3; distance: number } | null => {
  if (Math.abs(direction.y) < 0.0001) return null;
  
  const t = (FLOOR_Y - origin.y) / direction.y;
  if (t <= 0.0001) return null;
  
  const point = origin.clone().add(direction.clone().multiplyScalar(t));
  return { point, distance: t };
};

export const getRefractiveIndexForWavelength = (baseRefractiveIndex: number, wavelength: number): number => {
  const cauchyA = baseRefractiveIndex - 0.005;
  const cauchyB = 5000;
  const lambdaMicrometers = wavelength / 1000;
  return cauchyA + cauchyB / (lambdaMicrometers * lambdaMicrometers);
};

export const wavelengthToColor = (wavelength: number): THREE.Color => {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }
  return new THREE.Color(r, g, b);
};

export const getLensSurfaces = (lens: Lens): { front: SphereSurface; back: SphereSurface } => {
  const r1 = Math.abs(lens.radius1);
  const r2 = Math.abs(lens.radius2);
  const frontConvex = lens.radius1 > 0;
  const backConvex = lens.radius2 < 0;
  
  const frontCenterLocal = frontConvex ? r1 : -r1;
  const backCenterLocal = lens.thickness + (backConvex ? -r2 : r2);
  
  const frontVertexZ = frontConvex 
    ? frontCenterLocal - r1 
    : frontCenterLocal + r1;
  const backVertexZ = backConvex 
    ? backCenterLocal + r2 
    : backCenterLocal - r2;
  
  const profileCenterZ = (frontVertexZ + backVertexZ) / 2;
  const meshCenterZ = lens.position + lens.thickness / 2;
  
  const frontCenterZ = frontCenterLocal - profileCenterZ + meshCenterZ;
  const backCenterZ = backCenterLocal - profileCenterZ + meshCenterZ;
  
  return {
    front: {
      center: new THREE.Vector3(0, 0, frontCenterZ),
      radius: r1,
      isConvex: frontConvex
    },
    back: {
      center: new THREE.Vector3(0, 0, backCenterZ),
      radius: r2,
      isConvex: backConvex
    }
  };
};

export const intersectRaySphere = (
  rayOrigin: THREE.Vector3,
  rayDir: THREE.Vector3,
  sphereCenter: THREE.Vector3,
  sphereRadius: number
): { point: THREE.Vector3; distance: number } | null => {
  const oc = rayOrigin.clone().sub(sphereCenter);
  const a = rayDir.dot(rayDir);
  const b = 2 * oc.dot(rayDir);
  const c = oc.dot(oc) - sphereRadius * sphereRadius;
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return null;
  
  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  
  const t = Math.min(t1, t2) > 0.0001 ? Math.min(t1, t2) : (t2 > 0.0001 ? t2 : null);
  
  if (t === null) return null;
  
  const point = rayOrigin.clone().add(rayDir.clone().multiplyScalar(t));
  return { point, distance: t };
};

export const snellsLaw = (
  incidentDir: THREE.Vector3,
  normal: THREE.Vector3,
  n1: number,
  n2: number
): { refractedDir: THREE.Vector3 | null; isTotalReflection: boolean } => {
  const incidentDotNormal = incidentDir.dot(normal);
  const sinTheta1 = Math.sqrt(Math.max(0, 1 - incidentDotNormal * incidentDotNormal));
  
  const sinTheta2 = (n1 / n2) * sinTheta1;
  
  if (sinTheta2 >= 1) {
    return { refractedDir: null, isTotalReflection: true };
  }
  
  const cosTheta2 = Math.sqrt(1 - sinTheta2 * sinTheta2);
  const cosTheta1 = Math.abs(incidentDotNormal);
  
  const refractedDir = incidentDir.clone()
    .multiplyScalar(n1 / n2)
    .add(normal.clone().multiplyScalar((n1 / n2) * cosTheta1 - cosTheta2));
  
  return { refractedDir: refractedDir.normalize(), isTotalReflection: false };
};

export const getSurfaceNormal = (
  point: THREE.Vector3,
  surface: SphereSurface,
  isEntering: boolean
): THREE.Vector3 => {
  const normal = point.clone().sub(surface.center).normalize();
  return isEntering ? normal.negate() : normal;
};

export const traceRayThroughLensSystem = (
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  lenses: Lens[],
  wavelength: number
): Ray => {
  const ray: Ray = {
    id: `ray-${Math.random().toString(36).substr(2, 9)}`,
    origin: origin.clone(),
    direction: direction.clone().normalize(),
    wavelength,
    path: [origin.clone()],
    segments: [],
    intensity: 1.0,
    isTotallyReflected: false
  };
  
  if (origin.y <= FLOOR_Y) {
    return ray;
  }
  
  let currentPos = origin.clone();
  let currentDir = direction.clone().normalize();
  let currentMedium = 'air';
  const nAir = 1.0;
  
  const sortedLenses = [...lenses].sort((a, b) => a.position - b.position);
  
  for (let lensIdx = 0; lensIdx < sortedLenses.length; lensIdx++) {
    const lens = sortedLenses[lensIdx];
    const nLens = getRefractiveIndexForWavelength(lens.refractiveIndex, wavelength);
    const surfaces = getLensSurfaces(lens);
    
    const floorHit = intersectRayFloor(currentPos, currentDir);
    const frontIntersect = intersectRaySphere(
      currentPos, currentDir, surfaces.front.center, surfaces.front.radius
    );
    
    if (!frontIntersect) {
      if (floorHit && floorHit.distance > 0.001) {
        ray.path.push(floorHit.point);
        ray.segments.push({
          start: currentPos.clone(),
          end: floorHit.point,
          medium: currentMedium
        });
      } else {
        const endPoint = currentPos.clone().add(currentDir.clone().multiplyScalar(50));
        ray.path.push(endPoint);
        ray.segments.push({
          start: currentPos.clone(),
          end: endPoint,
          medium: currentMedium
        });
      }
      return ray;
    }
    
    if (floorHit && floorHit.distance > 0.001 && floorHit.distance < frontIntersect.distance) {
      ray.path.push(floorHit.point);
      ray.segments.push({
        start: currentPos.clone(),
        end: floorHit.point,
        medium: currentMedium
      });
      return ray;
    }
    
    if (Math.abs(frontIntersect.point.y) > lens.aperture + 0.01) {
      if (floorHit && floorHit.distance > 0.001) {
        ray.path.push(floorHit.point);
        ray.segments.push({
          start: currentPos.clone(),
          end: floorHit.point,
          medium: currentMedium
        });
      } else {
        const endPoint = currentPos.clone().add(currentDir.clone().multiplyScalar(50));
        ray.path.push(endPoint);
        ray.segments.push({
          start: currentPos.clone(),
          end: endPoint,
          medium: currentMedium
        });
      }
      return ray;
    }
    
    ray.path.push(frontIntersect.point.clone());
    ray.segments.push({
      start: currentPos.clone(),
      end: frontIntersect.point.clone(),
      medium: currentMedium
    });
    
    const frontNormal = getSurfaceNormal(frontIntersect.point, surfaces.front, true);
    const frontResult = snellsLaw(currentDir, frontNormal, nAir, nLens);
    
    if (frontResult.isTotalReflection || !frontResult.refractedDir) {
      ray.isTotallyReflected = true;
      ray.totalReflectionPoint = frontIntersect.point.clone();
      return ray;
    }
    
    currentPos = frontIntersect.point.clone();
    currentDir = frontResult.refractedDir;
    currentMedium = 'glass';
    
    const floorHitInside = intersectRayFloor(currentPos, currentDir);
    const backIntersect = intersectRaySphere(
      currentPos, currentDir, surfaces.back.center, surfaces.back.radius
    );
    
    if (!backIntersect) {
      if (floorHitInside && floorHitInside.distance > 0.001) {
        ray.path.push(floorHitInside.point);
        ray.segments.push({
          start: currentPos.clone(),
          end: floorHitInside.point,
          medium: currentMedium
        });
      } else {
        const endPoint = currentPos.clone().add(currentDir.clone().multiplyScalar(50));
        ray.path.push(endPoint);
        ray.segments.push({
          start: currentPos.clone(),
          end: endPoint,
          medium: currentMedium
        });
      }
      return ray;
    }
    
    if (floorHitInside && floorHitInside.distance > 0.001 && floorHitInside.distance < backIntersect.distance) {
      ray.path.push(floorHitInside.point);
      ray.segments.push({
        start: currentPos.clone(),
        end: floorHitInside.point,
        medium: currentMedium
      });
      return ray;
    }
    
    ray.path.push(backIntersect.point.clone());
    ray.segments.push({
      start: currentPos.clone(),
      end: backIntersect.point.clone(),
      medium: currentMedium
    });
    
    const backNormal = getSurfaceNormal(backIntersect.point, surfaces.back, false);
    const backResult = snellsLaw(currentDir, backNormal, nLens, nAir);
    
    if (backResult.isTotalReflection || !backResult.refractedDir) {
      ray.isTotallyReflected = true;
      ray.totalReflectionPoint = backIntersect.point.clone();
      return ray;
    }
    
    currentPos = backIntersect.point.clone();
    currentDir = backResult.refractedDir;
    currentMedium = 'air';
    ray.direction = currentDir.clone();
  }
  
  const finalFloorHit = intersectRayFloor(currentPos, currentDir);
  if (finalFloorHit && finalFloorHit.distance > 0.001) {
    ray.path.push(finalFloorHit.point);
    ray.segments.push({
      start: currentPos.clone(),
      end: finalFloorHit.point,
      medium: currentMedium
    });
  } else {
    const endPoint = currentPos.clone().add(currentDir.clone().multiplyScalar(50));
    ray.path.push(endPoint);
    ray.segments.push({
      start: currentPos.clone(),
      end: endPoint,
      medium: currentMedium
    });
  }
  
  return ray;
};

export const generateRaysFromObjectPoint = (
  objectPoint: THREE.Vector3,
  lenses: Lens[],
  rayCount: number,
  wavelengths: number[],
  maxAngle: number = 0.5
): Ray[] => {
  const rays: Ray[] = [];
  
  for (const wavelength of wavelengths) {
    for (let i = 0; i < rayCount; i++) {
      const angleRatio = (i / (rayCount - 1) - 0.5) * 2;
      const yAngle = angleRatio * maxAngle;
      const xAngle = angleRatio * maxAngle * 0.3;
      
      const direction = new THREE.Vector3(
        Math.sin(xAngle),
        Math.sin(yAngle),
        Math.cos(yAngle) * Math.cos(xAngle)
      ).normalize();
      
      const ray = traceRayThroughLensSystem(
        objectPoint.clone(),
        direction,
        lenses,
        wavelength
      );
      rays.push(ray);
    }
  }
  
  return rays;
};

export const generateMarginalRays = (
  objectPoint: THREE.Vector3,
  lenses: Lens[],
  wavelengths: number[]
): Ray[] => {
  const rays: Ray[] = [];
  const angles = [0.01, 0.4, -0.01, -0.4];
  
  for (const wavelength of wavelengths) {
    for (const angle of angles) {
      const direction = new THREE.Vector3(0, Math.sin(angle), Math.cos(angle)).normalize();
      const ray = traceRayThroughLensSystem(
        objectPoint.clone(),
        direction,
        lenses,
        wavelength
      );
      rays.push(ray);
    }
  }
  
  return rays;
};
