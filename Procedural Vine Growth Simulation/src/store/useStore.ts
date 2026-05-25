
import { create } from 'zustand'
import type { GrowthParams, LightSource, Obstacle, PresetId, GrowthStats } from '../types/vine'
import { presets, defaultPreset } from '../presets'

interface VineStore {
  currentPreset: PresetId
  params: GrowthParams
  lightSource: LightSource
  obstacles: Obstacle[]
  stats: GrowthStats
  isPlaying: boolean
  isPaused: boolean
  
  setPreset: (presetId: PresetId) => void
  setParams: (params: Partial<GrowthParams>) => void
  setLightSource: (light: Partial<LightSource>) => void
  addObstacle: (obstacle: Obstacle) => void
  removeObstacle: (id: string) => void
  setObstacles: (obstacles: Obstacle[]) => void
  setStats: (stats: Partial<GrowthStats>) => void
  togglePlay: () => void
  togglePause: () => void
  reset: () => void
}

const getPresetData = (presetId: PresetId) => {
  const preset = presets[presetId]
  return {
    params: { ...presets[defaultPreset].params, ...preset.params } as GrowthParams,
    lightSource: { ...presets[defaultPreset].lightSource, ...preset.lightSource } as LightSource,
    obstacles: preset.obstacles.map(o => ({
      ...o,
      position: o.position.clone()
    })),
  }
}

const initialData = getPresetData(defaultPreset)

export const useStore = create<VineStore>((set) => ({
  currentPreset: defaultPreset,
  params: initialData.params,
  lightSource: initialData.lightSource,
  obstacles: initialData.obstacles,
  stats: {
    fps: 60,
    totalNodes: 0,
    activeBranches: 0,
    collisionCount: 0,
    maxDepthReached: 0,
    nutritionRemaining: initialData.params.nutritionTotal,
  },
  isPlaying: true,
  isPaused: false,

  setPreset: (presetId: PresetId) => {
    const data = getPresetData(presetId)
    set({
      currentPreset: presetId,
      params: data.params,
      lightSource: data.lightSource,
      obstacles: data.obstacles,
      stats: {
        fps: 60,
        totalNodes: 0,
        activeBranches: 0,
        collisionCount: 0,
        maxDepthReached: 0,
        nutritionRemaining: data.params.nutritionTotal,
      },
    })
  },

  setParams: (newParams: Partial<GrowthParams>) => {
    set((state) => ({
      params: { ...state.params, ...newParams },
    }))
  },

  setLightSource: (light: Partial<LightSource>) => {
    set((state) => ({
      lightSource: { ...state.lightSource, ...light },
    }))
  },

  addObstacle: (obstacle: Obstacle) => {
    set((state) => ({
      obstacles: [...state.obstacles, obstacle],
    }))
  },

  removeObstacle: (id: string) => {
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== id),
    }))
  },

  setObstacles: (obstacles: Obstacle[]) => {
    set({ obstacles })
  },

  setStats: (newStats: Partial<GrowthStats>) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats },
    }))
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying }))
  },

  togglePause: () => {
    set((state) => ({ isPaused: !state.isPaused }))
  },

  reset: () => {
    const state = useStore.getState()
    const data = getPresetData(state.currentPreset)
    set({
      params: data.params,
      lightSource: data.lightSource,
      obstacles: data.obstacles,
      stats: {
        fps: 60,
        totalNodes: 0,
        activeBranches: 0,
        collisionCount: 0,
        maxDepthReached: 0,
        nutritionRemaining: data.params.nutritionTotal,
      },
      isPlaying: true,
      isPaused: false,
    })
  },
}))
