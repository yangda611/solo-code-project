
import * as THREE from 'three'
import type { Preset, PresetId } from '../types/vine'

export const presets: Record<PresetId, Preset> = {
  'phototropism': {
    id: 'phototropism',
    name: '预设一：单光源趋光性',
    description: '单光源直射下的趋光性缠绕效果，观察藤蔓如何向光源方向弯曲生长',
    params: {
      maxDepth: 10,
      branchAngle: Math.PI / 4,
      growthSpeed: 1.5,
      nutritionTotal: 200,
      nutritionCostPerSegment: 1,
      branchProbability: 0.5,
      phototropismWeight: 0.8,
      obstacleAvoidanceWeight: 0.1,
      randomnessWeight: 0.2,
      segmentLength: 0.5,
      leafInterval: 4,
    },
    lightSource: {
      direction: new THREE.Vector3(1, 2, 0.5).normalize(),
      intensity: 2,
      position: new THREE.Vector3(10, 20, 5),
    },
    obstacles: [],
  },
  
  'deadlock': {
    id: 'deadlock',
    name: '预设二：障碍物死锁',
    description: '密集障碍物导致生长路径死锁，观察绕障规划陷入局部极小值',
    params: {
      maxDepth: 15,
      branchAngle: Math.PI / 3,
      growthSpeed: 1,
      nutritionTotal: 300,
      nutritionCostPerSegment: 1,
      branchProbability: 0.4,
      phototropismWeight: 0.3,
      obstacleAvoidanceWeight: 0.9,
      randomnessWeight: 0.1,
      segmentLength: 0.4,
      leafInterval: 5,
    },
    lightSource: {
      direction: new THREE.Vector3(0, 1, 0).normalize(),
      intensity: 1.5,
      position: new THREE.Vector3(0, 15, 0),
    },
    obstacles: [
      { id: 'obs-1', position: new THREE.Vector3(0, 3, 0), radius: 1.5 },
      { id: 'obs-2', position: new THREE.Vector3(-2, 4, 1), radius: 1.2 },
      { id: 'obs-3', position: new THREE.Vector3(2, 4, -1), radius: 1.2 },
      { id: 'obs-4', position: new THREE.Vector3(-1, 5, -2), radius: 1 },
      { id: 'obs-5', position: new THREE.Vector3(1, 5, 2), radius: 1 },
    ],
  },
  
  'nutrition': {
    id: 'nutrition',
    name: '预设三：营养耗尽停止',
    description: '营养耗尽时的顶端停止分化，观察部分分支提前枯萎',
    params: {
      maxDepth: 20,
      branchAngle: Math.PI / 5,
      growthSpeed: 1.2,
      nutritionTotal: 50,
      nutritionCostPerSegment: 2,
      branchProbability: 0.7,
      phototropismWeight: 0.4,
      obstacleAvoidanceWeight: 0.2,
      randomnessWeight: 0.3,
      segmentLength: 0.5,
      leafInterval: 3,
    },
    lightSource: {
      direction: new THREE.Vector3(0.5, 1, 0.3).normalize(),
      intensity: 1.5,
      position: new THREE.Vector3(5, 10, 3),
    },
    obstacles: [
      { id: 'obs-1', position: new THREE.Vector3(3, 4, 2), radius: 1 },
    ],
  },
  
  'stack-overflow': {
    id: 'stack-overflow',
    name: '预设四：递归深度溢出',
    description: '极深递归导致性能下降，观察帧率骤降和自相交穿透',
    params: {
      maxDepth: 30,
      branchAngle: Math.PI / 6,
      growthSpeed: 3,
      nutritionTotal: 1000,
      nutritionCostPerSegment: 0.5,
      branchProbability: 0.95,
      phototropismWeight: 0.1,
      obstacleAvoidanceWeight: 0,
      randomnessWeight: 0.5,
      segmentLength: 0.3,
      leafInterval: 10,
    },
    lightSource: {
      direction: new THREE.Vector3(0, 1, 0).normalize(),
      intensity: 1,
      position: new THREE.Vector3(0, 30, 0),
    },
    obstacles: [],
  },
}

export const defaultPreset: PresetId = 'phototropism'
