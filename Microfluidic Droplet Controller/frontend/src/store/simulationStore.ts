import { create } from "zustand";

export interface Droplet {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  volume: number;
  velocity: { x: number; y: number; z: number };
  phase: number;
  isSatellite?: boolean;
}

export interface ChannelGeometry {
  type: "t-junction" | "flow-focusing";
  mainChannelWidth: number;
  mainChannelHeight: number;
  mainChannelLength: number;
  sideChannelWidth: number;
  sideChannelHeight: number;
  sideChannelLength: number;
  orificeWidth?: number;
  surfaceRoughness: number;
  wallContactAngle: number;
}

export interface FluidProperties {
  continuousPhaseViscosity: number;
  dispersedPhaseViscosity: number;
  continuousPhaseDensity: number;
  dispersedPhaseDensity: number;
  interfacialTension: number;
  flowRateRatio: number;
  capillaryNumber: number;
}

export interface SimulationResult {
  dropletSizeDistribution: number[];
  generationFrequency: number;
  averageDropletSize: number;
  cvValue: number;
  satelliteDropletCount: number;
  volumeConservationError: number;
  breakupMode: "dripping" | "jetting" | "threading";
  isAsymmetricBreakup: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  channel: Partial<ChannelGeometry>;
  fluid: Partial<FluidProperties>;
}

interface SimulationState {
  isSimulating: boolean;
  time: number;
  timeStep: number;
  droplets: Droplet[];
  channelGeometry: ChannelGeometry;
  fluidProperties: FluidProperties;
  simulationResult: SimulationResult | null;
  activePreset: string | null;
  showStreamlines: boolean;
  showInterfaceCurvature: boolean;
  showWettabilityGradient: boolean;
  presets: Preset[];

  setSimulating: (value: boolean) => void;
  setTime: (time: number) => void;
  setDroplets: (droplets: Droplet[]) => void;
  setChannelGeometry: (geometry: Partial<ChannelGeometry>) => void;
  setFluidProperties: (properties: Partial<FluidProperties>) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  setActivePreset: (presetId: string | null) => void;
  setShowStreamlines: (value: boolean) => void;
  setShowInterfaceCurvature: (value: boolean) => void;
  setShowWettabilityGradient: (value: boolean) => void;
  loadPreset: (presetId: string) => void;
  resetSimulation: () => void;
  advanceTime: () => void;
}

const defaultPresets: Preset[] = [
  {
    id: "monodisperse",
    name: "单分散液滴预设",
    description: "生成高度均匀的单分散液滴，CV<2%",
    icon: "💧",
    channel: {
      type: "flow-focusing",
      mainChannelWidth: 100,
      mainChannelHeight: 50,
      orificeWidth: 40,
      surfaceRoughness: 0.01,
      wallContactAngle: 110,
    },
    fluid: {
      flowRateRatio: 5,
      interfacialTension: 0.03,
      capillaryNumber: 0.01,
      continuousPhaseViscosity: 0.001,
      dispersedPhaseViscosity: 0.002,
    },
  },
  {
    id: "janus",
    name: "Janus 颗粒预设",
    description: "生成双组分 Janus 微球",
    icon: "⚪",
    channel: {
      type: "flow-focusing",
      mainChannelWidth: 150,
      mainChannelHeight: 75,
      orificeWidth: 60,
      surfaceRoughness: 0.005,
      wallContactAngle: 95,
    },
    fluid: {
      flowRateRatio: 3,
      interfacialTension: 0.02,
      capillaryNumber: 0.008,
      continuousPhaseViscosity: 0.0015,
      dispersedPhaseViscosity: 0.005,
    },
  },
  {
    id: "fusion",
    name: "液滴融合反应预设",
    description: "可控液滴融合与微反应",
    icon: "🔬",
    channel: {
      type: "t-junction",
      mainChannelWidth: 200,
      mainChannelHeight: 100,
      sideChannelWidth: 100,
      surfaceRoughness: 0.02,
      wallContactAngle: 105,
    },
    fluid: {
      flowRateRatio: 2,
      interfacialTension: 0.015,
      capillaryNumber: 0.015,
      continuousPhaseViscosity: 0.002,
      dispersedPhaseViscosity: 0.003,
    },
  },
  {
    id: "cell-encapsulation",
    name: "细胞封装预设",
    description: "单细胞包裹，生物相容性优化",
    icon: "🧬",
    channel: {
      type: "flow-focusing",
      mainChannelWidth: 80,
      mainChannelHeight: 40,
      orificeWidth: 30,
      surfaceRoughness: 0.001,
      wallContactAngle: 100,
    },
    fluid: {
      flowRateRatio: 8,
      interfacialTension: 0.025,
      capillaryNumber: 0.005,
      continuousPhaseViscosity: 0.005,
      dispersedPhaseViscosity: 0.01,
    },
  },
];

const defaultChannel: ChannelGeometry = {
  type: "flow-focusing",
  mainChannelWidth: 100,
  mainChannelHeight: 50,
  mainChannelLength: 500,
  sideChannelWidth: 50,
  sideChannelHeight: 50,
  sideChannelLength: 200,
  orificeWidth: 40,
  surfaceRoughness: 0.01,
  wallContactAngle: 110,
};

const defaultFluid: FluidProperties = {
  continuousPhaseViscosity: 0.001,
  dispersedPhaseViscosity: 0.002,
  continuousPhaseDensity: 1000,
  dispersedPhaseDensity: 950,
  interfacialTension: 0.03,
  flowRateRatio: 5,
  capillaryNumber: 0.01,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isSimulating: false,
  time: 0,
  timeStep: 0.001,
  droplets: [],
  channelGeometry: defaultChannel,
  fluidProperties: defaultFluid,
  simulationResult: null,
  activePreset: null,
  showStreamlines: true,
  showInterfaceCurvature: true,
  showWettabilityGradient: false,
  presets: defaultPresets,

  setSimulating: (value) => set({ isSimulating: value }),
  setTime: (time) => set({ time }),
  setDroplets: (droplets) => set({ droplets }),
  setChannelGeometry: (geometry) =>
    set((state) => ({
      channelGeometry: { ...state.channelGeometry, ...geometry },
    })),
  setFluidProperties: (properties) =>
    set((state) => ({
      fluidProperties: { ...state.fluidProperties, ...properties },
    })),
  setSimulationResult: (result) => set({ simulationResult: result }),
  setActivePreset: (presetId) => set({ activePreset: presetId }),
  setShowStreamlines: (value) => set({ showStreamlines: value }),
  setShowInterfaceCurvature: (value) => set({ showInterfaceCurvature: value }),
  setShowWettabilityGradient: (value) => set({ showWettabilityGradient: value }),

  loadPreset: (presetId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (preset) {
      set({
        activePreset: presetId,
        channelGeometry: { ...defaultChannel, ...preset.channel },
        fluidProperties: { ...defaultFluid, ...preset.fluid },
        droplets: [],
        time: 0,
        simulationResult: null,
      });
    }
  },

  resetSimulation: () =>
    set({
      isSimulating: false,
      time: 0,
      droplets: [],
      simulationResult: null,
    }),

  advanceTime: () =>
    set((state) => ({
      time: state.time + state.timeStep,
    })),
}));
