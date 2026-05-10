export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Particle {
  id: number;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  density: number;
  pressure: number;
  viscosity: number;
  color: Vector3;
  clusterId: number;
  isBoundary: boolean;
  shearRate: number;
  surfaceTension: number;
}

export interface FluidMaterial {
  id: string;
  name: string;
  type: 'shear-thickening' | 'shear-thinning';
  baseViscosity: number;
  consistencyIndex: number;
  powerLawIndex: number;
  surfaceTensionCoeff: number;
  restDensity: number;
  gasConstant: number;
  mass: number;
  smoothingLength: number;
  boundaryViscosity: number;
}

export interface SimulationConfig {
  materialId: string;
  particleCount: number;
  domainSize: { width: number; height: number; depth: number };
  timeStep: number;
  gravity: Vector3;
  enableSurfaceTension: boolean;
  boundaryDamping: number;
  shearForce: Vector3;
  shearForceRegion: {
    enabled: boolean;
    center: Vector3;
    radius: number;
  };
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  material: Omit<FluidMaterial, 'id'>;
  config: Partial<SimulationConfig>;
  initialPattern: 'dam-break' | 'droplet' | 'pool' | 'uniform';
  anomalies: {
    largeTimeStep: boolean;
    negativeSurfaceTension: boolean;
    missingBoundary: boolean;
    viscosityJump: boolean;
  };
}

export interface FrameData {
  frame: number;
  particles: Particle[];
  time: number;
  velocityField: { position: Vector3; velocity: Vector3 }[];
}
