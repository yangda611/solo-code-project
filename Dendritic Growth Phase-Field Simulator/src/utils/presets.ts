import type { PresetConfig } from '../types/simulation'

export const PRESETS: Record<string, PresetConfig> = {
  pureMetalDendrite: {
    id: 'pureMetalDendrite',
    name: '纯金属枝晶',
    description: '单枝晶生长，展示典型的树枝状形貌',
    icon: 'TreeDeciduous',
    params: {
      undercooling: 0.5,
      anisotropyStrength: 0.04,
      anisotropyMode: 4,
      interfaceThickness: 3.0,
      noiseAmplitude: 0.01,
      mobility: 1.0,
      timeStep: 0.05,
      gridSize: 512,
      nuclei: [{ x: 0.5, y: 0.5, radius: 10, orientation: 0 }]
    }
  },
  eutecticLamellar: {
    id: 'eutecticLamellar',
    name: '合金共晶层片',
    description: '双相竞争生长，形成层片状共晶组织',
    icon: 'Layers',
    params: {
      undercooling: 0.3,
      anisotropyStrength: 0.01,
      anisotropyMode: 4,
      interfaceThickness: 4.0,
      noiseAmplitude: 0.005,
      mobility: 0.8,
      timeStep: 0.04,
      gridSize: 512,
      nuclei: [
        { x: 0.3, y: 0.5, radius: 8, orientation: 0 },
        { x: 0.7, y: 0.5, radius: 8, orientation: Math.PI / 4 }
      ]
    }
  },
  polycrystalline: {
    id: 'polycrystalline',
    name: '多晶竞争生长',
    description: '多个晶核同时形核，晶界形成过程',
    icon: 'Hexagon',
    params: {
      undercooling: 0.4,
      anisotropyStrength: 0.02,
      anisotropyMode: 4,
      interfaceThickness: 3.5,
      noiseAmplitude: 0.02,
      mobility: 0.9,
      timeStep: 0.045,
      gridSize: 512,
      nuclei: [
        { x: 0.2, y: 0.2, radius: 6, orientation: 0 },
        { x: 0.8, y: 0.2, radius: 6, orientation: Math.PI / 6 },
        { x: 0.5, y: 0.3, radius: 6, orientation: Math.PI / 4 },
        { x: 0.2, y: 0.7, radius: 6, orientation: Math.PI / 3 },
        { x: 0.8, y: 0.7, radius: 6, orientation: Math.PI / 2 },
        { x: 0.5, y: 0.8, radius: 6, orientation: Math.PI * 2 / 3 },
        { x: 0.3, y: 0.5, radius: 6, orientation: Math.PI * 3 / 4 },
        { x: 0.7, y: 0.5, radius: 6, orientation: Math.PI * 5 / 6 }
      ]
    }
  },
  epitaxialThinFilm: {
    id: 'epitaxialThinFilm',
    name: '外延薄膜',
    description: '从基底外延生长，展示台阶流动形貌',
    icon: 'RectangleVertical',
    params: {
      undercooling: 0.35,
      anisotropyStrength: 0.03,
      anisotropyMode: 4,
      interfaceThickness: 2.5,
      noiseAmplitude: 0.008,
      mobility: 0.85,
      timeStep: 0.04,
      gridSize: 512,
      nuclei: [
        { x: 0.2, y: 0.95, radius: 5, orientation: 0 },
        { x: 0.4, y: 0.95, radius: 5, orientation: 0 },
        { x: 0.6, y: 0.95, radius: 5, orientation: 0 },
        { x: 0.8, y: 0.95, radius: 5, orientation: 0 },
        { x: 0.5, y: 0.95, radius: 5, orientation: 0 }
      ]
    }
  }
}

export const DEFAULT_PRESET = PRESETS.pureMetalDendrite
