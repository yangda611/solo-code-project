import { reactive } from 'vue';
import type {
  Point3D,
  ResidueType,
  SimulationParams,
  EnergyDataPoint,
  ContactPair
} from '~/types/hp-model';
import { getDefaultScenario } from '~/presets/scenarios';

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  step: number;
  temperature: number;
  positions: Point3D[];
  sequence: ResidueType[];
  energy: number;
  nativeContacts: number;
  contactPairs: ContactPair[];
  energyHistory: EnergyDataPoint[];
  params: SimulationParams;
  acceptedMoves: number;
  rejectedMoves: number;
}

const defaultScenario = getDefaultScenario();
const createDefaultPositions = (chainLength: number): Point3D[] => {
  const positions: Point3D[] = [];
  const start = -Math.floor(chainLength / 2);
  for (let i = 0; i < chainLength; i++) {
    positions.push({ x: start + i, y: 0, z: 0 });
  }
  return positions;
};

const state = reactive<SimulationState>({
  isRunning: false,
  isPaused: false,
  step: 0,
  temperature: defaultScenario.params.initialTemperature,
  positions: createDefaultPositions(defaultScenario.params.chainLength),
  sequence: defaultScenario.params.sequence,
  energy: 0,
  nativeContacts: 0,
  contactPairs: [],
  energyHistory: [],
  params: defaultScenario.params,
  acceptedMoves: 0,
  rejectedMoves: 0
});

export const useSimulationStore = () => {
  const setRunning = (running: boolean) => {
    state.isRunning = running;
  };

  const setPaused = (paused: boolean) => {
    state.isPaused = paused;
  };

  const reset = () => {
    const newPositions = createDefaultPositions(state.params.chainLength);
    state.step = 0;
    state.temperature = state.params.initialTemperature;
    state.positions = newPositions;
    state.energy = 0;
    state.nativeContacts = 0;
    state.contactPairs = [];
    state.energyHistory = [];
    state.isRunning = false;
    state.isPaused = false;
    state.acceptedMoves = 0;
    state.rejectedMoves = 0;
  };

  const setParams = (newParams: Partial<SimulationParams>) => {
    Object.assign(state.params, newParams);
  };

  const updatePositions = (positions: Point3D[]) => {
    state.positions = positions;
  };

  const updateEnergy = (energy: number, contacts: number, pairs: ContactPair[]) => {
    state.energy = energy;
    state.nativeContacts = contacts;
    state.contactPairs = pairs;
    state.energyHistory = [
      ...state.energyHistory.slice(-500),
      { step: state.step, energy, temperature: state.temperature, nativeContacts: contacts }
    ];
  };

  const updateTemperature = (temp: number) => {
    state.temperature = temp;
  };

  const incrementStep = () => {
    state.step++;
  };

  const recordAccepted = () => {
    state.acceptedMoves++;
  };

  const recordRejected = () => {
    state.rejectedMoves++;
  };

  const loadPreset = (scenario: SimulationParams) => {
    const newPositions = createDefaultPositions(scenario.chainLength);
    state.params = scenario;
    state.sequence = scenario.sequence;
    state.positions = newPositions;
    state.temperature = scenario.initialTemperature;
    state.step = 0;
    state.energy = 0;
    state.nativeContacts = 0;
    state.contactPairs = [];
    state.energyHistory = [];
    state.isRunning = false;
    state.isPaused = false;
    state.acceptedMoves = 0;
    state.rejectedMoves = 0;
  };

  return {
    state,
    setRunning,
    setPaused,
    reset,
    setParams,
    updatePositions,
    updateEnergy,
    updateTemperature,
    incrementStep,
    recordAccepted,
    recordRejected,
    loadPreset
  };
};
