export interface Complex64 {
    re: number;
    im: number;
}

export interface QubitNode {
    id: string;
    position: [number, number, number];
    state: [Complex64, Complex64];
}

export type GateType = 
    | 'H'
    | 'X'
    | 'Y'
    | 'Z'
    | 'S'
    | 'T'
    | { 'Rx': { theta: number } }
    | { 'Ry': { theta: number } }
    | { 'Rz': { theta: number } }
    | 'CNOT'
    | 'CZ'
    | 'Swap'
    | 'Toffoli';

export interface GateOperation {
    id: string;
    gateType: GateType;
    qubits: number[];
    parameters: number[];
    timestamp: string;
}

export interface QuantumCircuit {
    id: string;
    name: string;
    qubitCount: number;
    topology: QubitNode[];
    gates: GateOperation[];
    createdAt: string;
    updatedAt: string;
}

export interface DensityMatrix {
    data: Complex64[][];
    size: number;
}

export interface EntropyTrajectory {
    timestep: number;
    entropy: number;
}

export interface MeasurementResult {
    bitstring: string;
    probability: number;
}

export interface EvolutionResult {
    densityMatrix: DensityMatrix;
    entropyTrajectory: EntropyTrajectory[];
    measurementProbabilities: MeasurementResult[];
    decoherenceTimes: number[];
}

export interface NoiseParameters {
    decoherenceRate: number;
    calibrationError: number;
    crosstalkCoupling: number;
    measurementBasisError: number;
    temperature: number;
}
