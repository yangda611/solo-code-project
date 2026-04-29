import { create } from 'zustand';

const PRESET_SCENES = {
  safe: {
    name: '轻载安全吊装',
    towerHeight: 30,
    armLength: 25,
    counterweight: 12,
    cargoWeight: 3,
    windLevel: 2,
    rotationAngle: 45,
    description: '标准安全工况，所有参数在安全范围内'
  },
  critical: {
    name: '超重临界吊装',
    towerHeight: 35,
    armLength: 30,
    counterweight: 8,
    cargoWeight: 8,
    windLevel: 3,
    rotationAngle: 90,
    description: '货物重量接近额定载荷，倾覆风险极高'
  },
  strongWind: {
    name: '强风侧向吊装',
    towerHeight: 40,
    armLength: 35,
    counterweight: 10,
    cargoWeight: 5,
    windLevel: 8,
    rotationAngle: 135,
    description: '强风作用下产生巨大侧向力矩'
  },
  insufficient: {
    name: '配重不足吊装',
    towerHeight: 30,
    armLength: 35,
    counterweight: 4,
    cargoWeight: 6,
    windLevel: 4,
    rotationAngle: 180,
    description: '配重不足以平衡货物重量，极易倾覆'
  }
};

const WIND_FORCE_TABLE = [
  { level: 0, speed: 0, force: 0 },
  { level: 1, speed: 0.3, force: 0.005 },
  { level: 2, speed: 1.6, force: 0.02 },
  { level: 3, speed: 3.4, force: 0.08 },
  { level: 4, speed: 5.5, force: 0.2 },
  { level: 5, speed: 8.0, force: 0.4 },
  { level: 6, speed: 10.8, force: 0.7 },
  { level: 7, speed: 13.9, force: 1.1 },
  { level: 8, speed: 17.2, force: 1.6 },
  { level: 9, speed: 20.8, force: 2.2 },
  { level: 10, speed: 24.5, force: 3.0 },
  { level: 11, speed: 28.5, force: 3.9 },
  { level: 12, speed: 32.7, force: 5.0 }
];

const TOWER_BASE_RADIUS = 3;
const COUNTERWEIGHT_ARM_LENGTH = 8;
const TOWER_STRUCTURE_WEIGHT = 15;

function calculatePhysics(state) {
  const {
    towerHeight,
    armLength,
    counterweight,
    cargoWeight,
    windLevel,
    rotationAngle
  } = state;

  const wind = WIND_FORCE_TABLE[Math.min(Math.max(0, windLevel), 12)];
  const windForce = wind.force;
  const radAngle = (rotationAngle * Math.PI) / 180;

  const armElevation = towerHeight - 2;
  const cargoMoment = cargoWeight * armLength;
  const counterweightMoment = counterweight * COUNTERWEIGHT_ARM_LENGTH;

  const hasCargo = cargoWeight > 0.01;
  const hasCounterweight = counterweight > 0.01;
  const hasLoad = hasCargo || hasCounterweight;

  const totalWeight = cargoWeight + counterweight + TOWER_STRUCTURE_WEIGHT;

  const cargoMomentX = hasCargo ? cargoWeight * armLength * Math.sin(radAngle) : 0;
  const cargoMomentZ = hasCargo ? cargoWeight * armLength * Math.cos(radAngle) : 0;

  const cwRadAngle = radAngle + Math.PI;
  const cwMomentX = hasCounterweight ? counterweight * COUNTERWEIGHT_ARM_LENGTH * Math.sin(cwRadAngle) : 0;
  const cwMomentZ = hasCounterweight ? counterweight * COUNTERWEIGHT_ARM_LENGTH * Math.cos(cwRadAngle) : 0;

  const netMomentX = cargoMomentX + cwMomentX;
  const netMomentZ = cargoMomentZ + cwMomentZ;

  const cogX = netMomentX / totalWeight;
  const cogZ = netMomentZ / totalWeight;

  const towerCogY = (TOWER_STRUCTURE_WEIGHT * towerHeight * 0.5 +
    (hasCargo ? cargoWeight * armElevation : 0) +
    (hasCounterweight ? counterweight * armElevation : 0)) / totalWeight;

  const centerOffsetDistance = Math.sqrt(cogX * cogX + cogZ * cogZ);
  const maxSafeOffset = TOWER_BASE_RADIUS * 0.75;

  const stabilityRatio = hasLoad ? centerOffsetDistance / maxSafeOffset : 0;

  const momentRatio = hasCounterweight ? cargoMoment / counterweightMoment : (hasCargo ? 999 : 0);

  const momentImbalance = Math.abs(cargoMoment - counterweightMoment);
  const totalAvailableMoment = counterweightMoment + cargoMoment;
  const normalizedImbalance = totalAvailableMoment > 0 ? momentImbalance / totalAvailableMoment : 0;

  const windInfluence = windForce * armLength * 0.1;

  const momentRisk = calculateMomentRisk(cargoMoment, counterweightMoment, hasCargo, hasCounterweight);
  const offsetRisk = Math.min(1, stabilityRatio);
  const windRisk = Math.min(1, windInfluence * 0.5);

  const combinedRisk = calculateCombinedRisk(momentRisk, offsetRisk, windRisk, hasLoad);

  const { riskLevel, riskPercentage, stabilityScore } = calculateRiskLevel(combinedRisk, hasLoad);

  const tiltAngle = calculateTiltAngle(centerOffsetDistance, maxSafeOffset, combinedRisk, hasLoad);

  const tiltDirection = {
    x: centerOffsetDistance > 0.001 ? (cogX / centerOffsetDistance) * tiltAngle : 0,
    z: centerOffsetDistance > 0.001 ? (cogZ / centerOffsetDistance) * tiltAngle : 0
  };

  const swingAmplitude = hasCargo ? Math.min(30, cargoWeight * 1.5 + windForce * 8) : 0;
  const swingSpeed = 1 + windForce * 0.3;

  const riskZoneRadius = Math.max(armLength * 1.2, 15);

  return {
    centerOfGravity: { x: cogX, y: towerCogY, z: cogZ },
    centerOffsetDistance,
    maxSafeOffset,
    stabilityRatio,
    torqueStability: momentRatio,
    windInfluence,
    combinedRisk,
    momentRisk,
    offsetRisk,
    windRisk,
    riskLevel,
    riskPercentage: Math.round(riskPercentage),
    stabilityScore: Math.max(0, Math.round(stabilityScore)),
    tiltAngle,
    tiltDirection,
    swingAmplitude,
    swingSpeed,
    riskZoneRadius,
    cargoTorque: cargoMoment,
    counterweightTorque: counterweightMoment,
    netTorque: cargoMoment - counterweightMoment,
    windForce: wind.force,
    windSpeed: wind.speed,
    normalizedImbalance
  };
}

function calculateMomentRisk(cargoMoment, counterweightMoment, hasCargo, hasCounterweight) {
  if (!hasCargo && !hasCounterweight) {
    return 0;
  }

  if (!hasCounterweight && hasCargo) {
    return 1;
  }

  if (!hasCargo) {
    return 0;
  }

  const ratio = cargoMoment / counterweightMoment;

  if (ratio <= 0.5) {
    return 0;
  } else if (ratio <= 0.7) {
    return (ratio - 0.5) * 0.5;
  } else if (ratio <= 0.85) {
    return 0.1 + (ratio - 0.7) * 0.6;
  } else if (ratio <= 1.0) {
    return 0.19 + (ratio - 0.85) * 2.067;
  } else if (ratio <= 1.2) {
    return 0.5 + (ratio - 1.0) * 1.5;
  } else {
    return Math.min(1, 0.8 + (ratio - 1.2) * 0.5);
  }
}

function calculateCombinedRisk(momentRisk, offsetRisk, windRisk, hasLoad) {
  if (!hasLoad) {
    return 0;
  }

  const baseRisk = momentRisk * 0.5 + offsetRisk * 0.35 + windRisk * 0.15;

  if (momentRisk > 0.7 && offsetRisk > 0.5) {
    return Math.min(1, baseRisk * 1.3);
  }

  if (momentRisk > 0.9 || offsetRisk > 0.9) {
    return Math.min(1, baseRisk * 1.15);
  }

  return baseRisk;
}

function calculateRiskLevel(combinedRisk, hasLoad) {
  if (!hasLoad) {
    return {
      riskLevel: 'safe',
      riskPercentage: 0,
      stabilityScore: 100
    };
  }

  let riskLevel = 'safe';
  let riskPercentage = 0;
  let stabilityScore = 100;

  if (combinedRisk < 0.25) {
    riskLevel = 'safe';
    riskPercentage = combinedRisk * 160;
    stabilityScore = 100 - riskPercentage;
  } else if (combinedRisk < 0.45) {
    riskLevel = 'warning';
    riskPercentage = 40 + (combinedRisk - 0.25) * 150;
    stabilityScore = 75 - (combinedRisk - 0.25) * 125;
  } else if (combinedRisk < 0.65) {
    riskLevel = 'danger';
    riskPercentage = 70 + (combinedRisk - 0.45) * 100;
    stabilityScore = 50 - (combinedRisk - 0.45) * 150;
  } else {
    riskLevel = 'critical';
    riskPercentage = 90 + Math.min(10, (combinedRisk - 0.65) * 30);
    stabilityScore = Math.max(0, 20 - (combinedRisk - 0.65) * 50);
  }

  return {
    riskLevel,
    riskPercentage: Math.min(100, Math.max(0, riskPercentage)),
    stabilityScore: Math.min(100, Math.max(0, stabilityScore))
  };
}

function calculateTiltAngle(centerOffsetDistance, maxSafeOffset, combinedRisk, hasLoad) {
  if (!hasLoad || centerOffsetDistance < 0.01) {
    return 0;
  }

  const offsetRatio = centerOffsetDistance / maxSafeOffset;
  
  if (offsetRatio < 0.3) {
    return offsetRatio * 2;
  } else if (offsetRatio < 0.6) {
    return 0.6 + (offsetRatio - 0.3) * 8;
  } else if (offsetRatio < 1.0) {
    return 3 + (offsetRatio - 0.6) * 15;
  } else {
    return Math.min(15, 9 + Math.min(offsetRatio - 1, 0.5) * 12);
  }
}

const initialState = {
  ...PRESET_SCENES.safe,
  currentPreset: 'safe',
  isAnimating: false,
  animationTime: 0,
  physics: null
};

export const useCraneStore = create((set, get) => ({
  ...initialState,
  physics: calculatePhysics(initialState),

  setTowerHeight: (value) => set((state) => {
    const newState = { ...state, towerHeight: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  setArmLength: (value) => set((state) => {
    const newState = { ...state, armLength: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  setCounterweight: (value) => set((state) => {
    const newState = { ...state, counterweight: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  setCargoWeight: (value) => set((state) => {
    const newState = { ...state, cargoWeight: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  setWindLevel: (value) => set((state) => {
    const newState = { ...state, windLevel: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  setRotationAngle: (value) => set((state) => {
    const newState = { ...state, rotationAngle: value, currentPreset: null };
    return { ...newState, physics: calculatePhysics(newState) };
  }),

  loadPreset: (presetKey) => {
    const preset = PRESET_SCENES[presetKey];
    if (!preset) return;
    
    set((state) => {
      const newState = {
        ...state,
        ...preset,
        currentPreset: presetKey
      };
      return { ...newState, physics: calculatePhysics(newState) };
    });
  },

  updateAnimationTime: (delta) => set((state) => ({
    animationTime: state.animationTime + delta
  })),

  reset: () => {
    const defaultState = { ...initialState };
    set({
      ...defaultState,
      physics: calculatePhysics(defaultState)
    });
  },

  getPresets: () => PRESET_SCENES
}));
