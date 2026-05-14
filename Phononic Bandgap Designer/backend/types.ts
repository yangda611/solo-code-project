export interface MaterialParams {
    matrixModulus: number;
    scattererModulus: number;
    matrixDensity: number;
    scattererDensity: number;
}

export interface GeometryParams {
    latticeType: string;
    fillingFraction: number;
    scattererShape: string;
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
    highSymmetryPath: HighSymmetryPoint[];
}
