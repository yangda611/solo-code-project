export interface WaveParams {
  period: number;
  height: number;
  direction: number;
  breakingThreshold: number;
  dispersionStrength: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface Streamline {
  points: { x: number; y: number }[];
  age: number;
}

export interface PresetScene {
  name: string;
  description: string;
  params: WaveParams;
  terrain: number[][];
}

export interface SimulationState {
  isRunning: boolean;
  time: number;
  waveParams: WaveParams;
}

export const DEFAULT_WAVE_PARAMS: WaveParams = {
  period: 8,
  height: 1.5,
  direction: 0,
  breakingThreshold: 0.6,
  dispersionStrength: 0.8
};

export const GRID_SIZE = 256;
export const DX = 2;
export const DY = 2;
export const DT = 0.02;
export const GRAVITY = 9.81;
