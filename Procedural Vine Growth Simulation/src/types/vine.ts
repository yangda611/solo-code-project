
import * as THREE from 'three'

export interface VineNode {
  id: string
  position: THREE.Vector3
  direction: THREE.Vector3
  thickness: number
  depth: number
  nutrition: number
  isGrowing: boolean
  isDead: boolean
  isDeadlocked: boolean
  age: number
  collisionFlash: number
  witherProgress: number
}

export interface VineBranch {
  id: string
  nodes: VineNode[]
  leaves: Leaf[]
  parentId: string | null
  depth: number
}

export interface Leaf {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
  growthProgress: number
  nodeId: string
}

export interface Obstacle {
  id: string
  position: THREE.Vector3
  radius: number
}

export interface GrowthParams {
  maxDepth: number
  branchAngle: number
  growthSpeed: number
  nutritionTotal: number
  nutritionCostPerSegment: number
  branchProbability: number
  phototropismWeight: number
  obstacleAvoidanceWeight: number
  randomnessWeight: number
  segmentLength: number
  leafInterval: number
}

export interface LightSource {
  direction: THREE.Vector3
  intensity: number
  position: THREE.Vector3
}

export interface LSystemState {
  position: THREE.Vector3
  direction: THREE.Vector3
  thickness: number
  depth: number
}

export interface LSystemRule {
  symbol: string
  replacement: string
  probability?: number
}

export interface Preset {
  id: string
  name: string
  description: string
  params: Partial<GrowthParams>
  lightSource: Partial<LightSource>
  obstacles: Obstacle[]
}

export type PresetId = 'phototropism' | 'deadlock' | 'nutrition' | 'stack-overflow'

export interface GrowthStats {
  fps: number
  totalNodes: number
  activeBranches: number
  collisionCount: number
  maxDepthReached: number
  nutritionRemaining: number
}
