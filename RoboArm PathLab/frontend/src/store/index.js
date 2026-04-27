import { create } from 'zustand';

const defaultArmConfig = {
  jointCount: 6,
  linkLengths: [1, 1, 1, 0.8, 0.8, 0.6],
  angleLimits: [
    { min: -Math.PI, max: Math.PI },
    { min: -Math.PI / 2, max: Math.PI / 2 },
    { min: -Math.PI, max: Math.PI },
    { min: -Math.PI / 2, max: Math.PI / 2 },
    { min: -Math.PI, max: Math.PI },
    { min: -Math.PI / 3, max: Math.PI / 3 }
  ],
  basePosition: { x: 0, y: 0, z: 0 },
  linkRadius: 0.15
};

const defaultTarget = {
  position: { x: 1.5, y: 2, z: 0 },
  radius: 0.2
};

const defaultObstacles = [];

const useStore = create((set, get) => ({
  armConfig: defaultArmConfig,
  jointAngles: new Array(defaultArmConfig.jointCount).fill(0),
  targetPoint: defaultTarget,
  obstacles: defaultObstacles,
  
  isReachable: null,
  hasCollision: false,
  collisions: [],
  
  currentPath: null,
  pathProgress: 0,
  isAnimating: false,
  animationType: null,
  
  showPathPreview: false,
  showCollisionWarning: false,
  showTargetSnap: false,
  showTaskComplete: false,
  
  updateArmConfig: (config) => {
    const newJointCount = config.jointCount || get().armConfig.jointCount;
    set((state) => ({
      armConfig: {
        ...state.armConfig,
        ...config,
        angleLimits: config.angleLimits || state.armConfig.angleLimits
      },
      jointAngles: new Array(newJointCount).fill(0)
    }));
  },
  
  updateJointAngles: (angles) => set({ jointAngles: angles }),
  
  updateTargetPoint: (position) => set((state) => ({
    targetPoint: {
      ...state.targetPoint,
      position
    }
  })),
  
  addObstacle: (obstacle) => set((state) => ({
    obstacles: [...state.obstacles, { ...obstacle, id: Date.now() }]
  })),
  
  removeObstacle: (id) => set((state) => ({
    obstacles: state.obstacles.filter((o) => o.id !== id)
  })),
  
  clearObstacles: () => set({ obstacles: [] }),
  
  setReachable: (reachable) => set({ isReachable: reachable }),
  
  setCollisionStatus: (hasCollision, collisions = []) => set({
    hasCollision,
    collisions
  }),
  
  setCurrentPath: (path) => set({
    currentPath: path,
    pathProgress: 0
  }),
  
  setPathProgress: (progress) => set({ pathProgress: progress }),
  
  startAnimation: (type) => set({
    isAnimating: true,
    animationType: type
  }),
  
  stopAnimation: () => set({
    isAnimating: false,
    animationType: null
  }),
  
  enablePathPreview: () => set({ showPathPreview: true }),
  disablePathPreview: () => set({ showPathPreview: false }),
  
  enableCollisionWarning: () => set({ showCollisionWarning: true }),
  disableCollisionWarning: () => set({ showCollisionWarning: false }),
  
  enableTargetSnap: () => set({ showTargetSnap: true }),
  disableTargetSnap: () => set({ showTargetSnap: false }),
  
  enableTaskComplete: () => set({ showTaskComplete: true }),
  disableTaskComplete: () => set({ showTaskComplete: false }),
  
  resetAll: () => set({
    jointAngles: new Array(defaultArmConfig.jointCount).fill(0),
    targetPoint: defaultTarget,
    obstacles: defaultObstacles,
    isReachable: null,
    hasCollision: false,
    collisions: [],
    currentPath: null,
    pathProgress: 0,
    isAnimating: false,
    animationType: null,
    showPathPreview: false,
    showCollisionWarning: false,
    showTargetSnap: false,
    showTaskComplete: false
  })
}));

export default useStore;
