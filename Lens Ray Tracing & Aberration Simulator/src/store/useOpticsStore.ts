import { create } from 'zustand';
import * as THREE from 'three';
import type { Lens, Ray, AberrationData, Preset } from '@/types/optics';
import { generateRaysFromObjectPoint } from '@/utils/opticsMath';
import { analyzeAberrations } from '@/utils/aberrationAnalysis';
import { DEFAULT_PRESET, PRESETS } from '@/config/presets';

interface OpticsState {
  lenses: Lens[];
  objectPoint: THREE.Vector3;
  rays: Ray[];
  aberrationData: AberrationData;
  rayCount: number;
  wavelengths: number[];
  currentPresetId: string;
  isPlaying: boolean;
  animationTime: number;
  
  setLenses: (lenses: Lens[]) => void;
  updateLens: (id: string, updates: Partial<Lens>) => void;
  addLens: (lens: Lens) => void;
  removeLens: (id: string) => void;
  setObjectPoint: (point: THREE.Vector3) => void;
  setRayCount: (count: number) => void;
  setWavelengths: (wavelengths: number[]) => void;
  calculateRays: () => void;
  loadPreset: (preset: Preset) => void;
  setCurrentPresetId: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  setAnimationTime: (time: number) => void;
}

export const useOpticsStore = create<OpticsState>((set, get) => ({
  lenses: [...DEFAULT_PRESET.lenses],
  objectPoint: DEFAULT_PRESET.objectPoint.clone(),
  rays: [],
  aberrationData: {
    sphericalAberration: 0,
    chromaticAberration: 0,
    coma: 0,
    paraxialFocalPoint: null,
    marginalFocalPoint: null,
    redFocalPoint: null,
    blueFocalPoint: null
  },
  rayCount: DEFAULT_PRESET.rayCount,
  wavelengths: [...DEFAULT_PRESET.wavelengths],
  currentPresetId: DEFAULT_PRESET.id,
  isPlaying: true,
  animationTime: 0,

  setLenses: (lenses) => set({ lenses }),
  
  updateLens: (id, updates) => set((state) => {
    const newLenses = state.lenses.map(l => 
      l.id === id ? { ...l, ...updates } : l
    );
    return { lenses: newLenses };
  }),
  
  addLens: (lens) => set((state) => ({
    lenses: [...state.lenses, lens]
  })),
  
  removeLens: (id) => set((state) => ({
    lenses: state.lenses.filter(l => l.id !== id)
  })),
  
  setObjectPoint: (point) => set({ objectPoint: point }),
  
  setRayCount: (count) => set({ rayCount: count }),
  
  setWavelengths: (wavelengths) => set({ wavelengths }),
  
  calculateRays: () => set((state) => {
    const rays = generateRaysFromObjectPoint(
      state.objectPoint,
      state.lenses,
      state.rayCount,
      state.wavelengths,
      1.2
    );
    const aberrationData = analyzeAberrations(rays);
    return { rays, aberrationData };
  }),
  
  loadPreset: (preset) => set({
    lenses: [...preset.lenses.map(l => ({ ...l }))],
    objectPoint: preset.objectPoint.clone(),
    rayCount: preset.rayCount,
    wavelengths: [...preset.wavelengths],
    currentPresetId: preset.id
  }),
  
  setCurrentPresetId: (id) => set({ currentPresetId: id }),
  
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setAnimationTime: (time) => set({ animationTime: time })
}));
