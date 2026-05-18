export interface MacGrid {
  nx: number;
  ny: number;
  dx: number;
  dy: number;
  u: Float32Array;
  v: Float32Array;
  p: Float32Array;
  vort: Float32Array;
  phi: Float32Array;
}

export interface StructureState {
  y: number;
  y_dot: number;
  y_ddot: number;
  lift: number;
  drag: number;
}

export interface SimulationParams {
  reynolds: number;
  diameter: number;
  stiffness: number;
  damping: number;
  mass: number;
  inflowVelocity: number;
}

export interface PresetConfig {
  name: string;
  reynolds: number;
  diameter: number;
  stiffness: number;
  damping: number;
  description: string;
}

export interface SnapshotData {
  version: string;
  timestamp: number;
  params: SimulationParams;
  structure: {
    displacement: number[];
    velocity: number[];
    lift: number[];
    time: number[];
  };
}

export type VisualizationTab = 'lissajous' | 'spectrum' | 'wake' | 'bifurcation';

export interface FFTResult {
  frequencies: Float32Array;
  magnitudes: Float32Array;
}
