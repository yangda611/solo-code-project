import { create } from 'zustand'

const DEFAULT_DESIGN = {
  outerRadius: 1.0,
  innerRadius: 0.88,
  length: 3.5,
  thickness: 0.12,
  windowDiameter: 0.3,
  windowCount: 3,
  ribCount: 10,
  ribSpacing: 0.35,
  ribHeight: 0.06,
  endCapType: 'hemispherical',
  weldQuality: 'class_a'
}

const DEFAULT_MATERIAL = {
  id: 1,
  name: '钛合金 Ti-6Al-4V',
  density: 4430,
  youngs_modulus: 114e9,
  poisson_ratio: 0.33,
  yield_strength: 880e6,
  ultimate_strength: 950e6,
  fracture_toughness: 75e6,
  fatigue_coefficient: 1200e6,
  fatigue_exponent: -0.12,
  ductile_brittle_transition: 153,
  thermal_expansion: 8.6e-6
}

export const useSimulationStore = create((set, get) => ({
  depth: 500,
  targetDepth: 500,
  temperature: 277.15,

  design: DEFAULT_DESIGN,
  material: DEFAULT_MATERIAL,

  analysisResult: null,
  isAnalyzing: false,

  materials: [],
  presets: [],
  activePreset: null,

  showStressHeatmap: true,
  showDeformation: true,
  showWireframe: false,
  showRibs: true,
  showWindows: true,
  deformationScale: 50,

  animationTime: 0,
  crackProgress: 0,
  bubbleIntensity: 0.3,

  failureState: {
    hasCrack: false,
    crackLocations: [],
    isBursting: false,
    criticalZones: []
  },

  setDepth: (depth) => set({ depth, targetDepth: depth }),
  setTargetDepth: (depth) => set({ targetDepth: depth }),
  setTemperature: (temp) => set({ temperature: temp }),

  updateDesign: (updates) => set((state) => ({
    design: { ...state.design, ...updates }
  })),

  setMaterial: (material) => set({ material }),

  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setMaterials: (materials) => set({ materials }),
  setPresets: (presets) => set({ presets }),
  setActivePreset: (presetId) => set({ activePreset: presetId }),

  loadPreset: (preset) => {
    if (!preset || typeof preset !== 'object') return

    const state = get()
    const config = preset.design_config || {}

    let matchedMaterial = state.material || DEFAULT_MATERIAL
    if (config.material && Array.isArray(state.materials) && state.materials.length > 0) {
      const presetMaterialName = String(config.material)
      const found = state.materials.find(m => {
        if (!m || !m.name) return false
        const materialName = String(m.name)
        return materialName === presetMaterialName ||
          materialName.toLowerCase().includes(presetMaterialName.toLowerCase()) ||
          presetMaterialName.toLowerCase().includes(materialName.split(' ')[0]?.toLowerCase() || '')
      })
      if (found) {
        matchedMaterial = found
      }
    }

    const targetDepth = typeof preset.target_depth === 'number' ? preset.target_depth : 500

    set({
      design: {
        outerRadius: typeof config.outerRadius === 'number' ? config.outerRadius : DEFAULT_DESIGN.outerRadius,
        innerRadius: typeof config.innerRadius === 'number' ? config.innerRadius : DEFAULT_DESIGN.innerRadius,
        length: typeof config.length === 'number' ? config.length : DEFAULT_DESIGN.length,
        thickness: typeof config.thickness === 'number' ? config.thickness : DEFAULT_DESIGN.thickness,
        windowDiameter: typeof config.windowDiameter === 'number' ? config.windowDiameter : DEFAULT_DESIGN.windowDiameter,
        windowCount: typeof config.windowCount === 'number' ? config.windowCount : DEFAULT_DESIGN.windowCount,
        ribCount: typeof config.ribCount === 'number' ? config.ribCount : DEFAULT_DESIGN.ribCount,
        ribSpacing: typeof config.ribSpacing === 'number' ? config.ribSpacing : DEFAULT_DESIGN.ribSpacing,
        ribHeight: typeof config.ribHeight === 'number' ? config.ribHeight : DEFAULT_DESIGN.ribHeight,
        endCapType: config.endCapType || DEFAULT_DESIGN.endCapType,
        weldQuality: config.weldQuality || DEFAULT_DESIGN.weldQuality
      },
      material: matchedMaterial,
      activePreset: preset.id || null,
      depth: targetDepth,
      targetDepth: targetDepth
    })
  },

  toggleStressHeatmap: () => set((state) => ({ showStressHeatmap: !state.showStressHeatmap })),
  toggleDeformation: () => set((state) => ({ showDeformation: !state.showDeformation })),
  toggleWireframe: () => set((state) => ({ showWireframe: !state.showWireframe })),
  toggleRibs: () => set((state) => ({ showRibs: !state.showRibs })),
  toggleWindows: () => set((state) => ({ showWindows: !state.showWindows })),
  setDeformationScale: (scale) => set({ deformationScale: scale }),

  updateAnimationTime: (delta) => set((state) => ({
    animationTime: state.animationTime + delta
  })),

  updateFailureState: (result) => {
    if (!result) return

    const hasCriticalFailure = result.failureModes?.some(
      f => f.severity === 'critical' || f.severity === 'catastrophic'
    )

    const scfCritical = result.stressConcentrationFactor > 4.0

    set({
      failureState: {
        hasCrack: hasCriticalFailure || scfCritical,
        crackLocations: scfCritical ? [
          { angle: 0, progress: Math.min(1, (result.stressConcentrationFactor - 4) / 2) },
          { angle: Math.PI / 2, progress: Math.min(1, (result.stressConcentrationFactor - 4) / 2.5) },
          { angle: Math.PI, progress: Math.min(1, (result.stressConcentrationFactor - 4) / 3) }
        ] : [],
        isBursting: result.failureModes?.some(f => f.type === 'burst'),
        criticalZones: result.failureModes || []
      },
      crackProgress: scfCritical ? Math.min(1, (result.stressConcentrationFactor - 4) / 2) : 0
    })
  },

  setBubbleIntensity: (intensity) => set({ bubbleIntensity: intensity }),

  resetDesign: () => set({
    design: DEFAULT_DESIGN,
    material: DEFAULT_MATERIAL,
    depth: 500,
    targetDepth: 500,
    analysisResult: null,
    activePreset: null,
    failureState: {
      hasCrack: false,
      crackLocations: [],
      isBursting: false,
      criticalZones: []
    }
  }),

  getDesignParams: () => {
    const state = get()
    return {
      ...state.design,
      material: state.material
    }
  }
}))
