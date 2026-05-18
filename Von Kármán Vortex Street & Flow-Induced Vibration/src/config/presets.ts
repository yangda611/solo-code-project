export const PRESETS: Record<string, any> = {
  stable: {
    reynolds: 10,
    diameter: 0.1,
    stiffness: 1000,
    damping: 0.1,
    inflowVelocity: 1.0
  },
  critical: {
    reynolds: 100,
    diameter: 0.1,
    stiffness: 1000,
    damping: 0.05,
    inflowVelocity: 1.0
  },
  lockin: {
    reynolds: 200,
    diameter: 0.1,
    stiffness: 30,
    damping: 0.005,
    inflowVelocity: 1.0
  },
  galloping: {
    reynolds: 500,
    diameter: 0.12,
    stiffness: 10,
    damping: 0.001,
    inflowVelocity: 1.5
  }
};

export const DEFAULT_PARAMS = {
  reynolds: 100,
  diameter: 0.1,
  stiffness: 100,
  damping: 0.01,
  mass: 1.0,
  inflowVelocity: 1.0
};
