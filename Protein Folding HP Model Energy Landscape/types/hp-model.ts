export type ResidueType = 'H' | 'P';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Conformation {
  id: string;
  sequence: ResidueType[];
  positions: Point3D[];
  energy: number;
  nativeContacts: number;
  temperature: number;
  step: number;
  timestamp: number;
}

export interface SimulationParams {
  chainLength: number;
  sequence: ResidueType[];
  hydrophobicStrength: number;
  initialTemperature: number;
  coolingRate: number;
  simulationMethod: 'metropolis' | 'molecular-dynamics';
}

export interface FoldingTrajectory {
  id: string;
  name: string;
  params: SimulationParams;
  conformations: Conformation[];
  createdAt: number;
}

export interface EnergyDataPoint {
  step: number;
  energy: number;
  temperature: number;
  nativeContacts: number;
}

export interface ContactPair {
  i: number;
  j: number;
}

export interface MoveResult {
  positions: Point3D[];
  deltaE: number;
  accepted: boolean;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  params: SimulationParams;
  phenomenon: string;
}
