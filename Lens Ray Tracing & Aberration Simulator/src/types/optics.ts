import * as THREE from 'three';

export interface Lens {
  id: string;
  position: number;
  radius1: number;
  radius2: number;
  thickness: number;
  refractiveIndex: number;
  aperture: number;
}

export interface RaySegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  medium: string;
}

export interface Ray {
  id: string;
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  wavelength: number;
  path: THREE.Vector3[];
  segments: RaySegment[];
  intensity: number;
  isTotallyReflected: boolean;
  totalReflectionPoint?: THREE.Vector3;
}

export interface SphereSurface {
  center: THREE.Vector3;
  radius: number;
  isConvex: boolean;
}

export interface AberrationData {
  sphericalAberration: number;
  chromaticAberration: number;
  coma: number;
  paraxialFocalPoint: THREE.Vector3 | null;
  marginalFocalPoint: THREE.Vector3 | null;
  redFocalPoint: THREE.Vector3 | null;
  blueFocalPoint: THREE.Vector3 | null;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  lenses: Lens[];
  objectPoint: THREE.Vector3;
  rayCount: number;
  wavelengths: number[];
  showAberrationType: 'spherical' | 'chromatic' | 'coma' | 'totalReflection';
  rayAngles?: number[];
}
