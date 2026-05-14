export interface MaterialParams {
    matrixModulus: number;
    scattererModulus: number;
    matrixDensity: number;
    scattererDensity: number;
}

export interface GeometryParams {
    latticeType: 'square' | 'hexagonal' | 'diamond' | 'cubic';
    fillingFraction: number;
    scattererShape: 'circle' | 'square' | 'sphere' | 'cube';
    latticeConstant: number;
}

export interface BandDataPoint {
    k: number;
    frequency: number;
    bandIndex: number;
}

export interface BandGap {
    startFrequency: number;
    endFrequency: number;
    normalizedWidth: number;
}

export interface HighSymmetryPoint {
    name: string;
    coordinates: number[];
}

export interface EigenMode {
    frequency: number;
    modeIndex: number;
    kPoint: number[];
    displacementField: number[][];
}

export interface SimulationResult {
    bandData: BandDataPoint[];
    bandGaps: BandGap[];
    eigenModes: EigenMode[];
    highSymmetryPath: HighSymmetryPoint[];
}

export interface Preset {
    id: string;
    name: string;
    description: string;
    materialParams: MaterialParams;
    geometryParams: GeometryParams;
}

export interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    amplitude: number;
    phase: number;
}
