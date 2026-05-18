export interface Nucleus {
  x: number
  y: number
  radius: number
  orientation: number
}

export interface SimulationParams {
  undercooling: number
  anisotropyStrength: number
  anisotropyMode: number
  interfaceThickness: number
  noiseAmplitude: number
  mobility: number
  timeStep: number
  gridSize: number
  nuclei: Nucleus[]
}

export interface SimulationState {
  id: string
  timestamp: number
  name: string
  params: SimulationParams
  frameNumber: number
  simulationTime: number
  phaseField: number[]
  concentrationField: number[]
}

export interface PresetConfig {
  id: string
  name: string
  description: string
  icon: string
  params: SimulationParams
}

export type VisualMode = 'phase' | 'concentration' | 'orientation' | 'curvature'

export interface TipData {
  x: number
  y: number
  vx: number
  vy: number
  speed: number
}

export interface ArtifactData {
  gridLocking: boolean
  speedUnderestimation: boolean
  denseSidebranches: boolean
  wavelengthFreezing: boolean
}
