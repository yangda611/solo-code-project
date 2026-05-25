import { createStore } from 'vuex'

export default createStore({
  state: {
    bones: [],
    selectedBone: null,
    targetPosition: { x: 400, y: 200 },
    solverType: 'ccd',
    maxIterations: 100,
    threshold: 0.1,
    solveResult: null,
    errorHistory: [],
    constraintViolations: [],
    meshVertices: [],
    skinWeights: [],
    keyframes: [],
    currentFrame: 0,
    isPlaying: false,
    animationSpeed: 1,
    trailPath: [],
    springDamping: 0.8,
    springStiffness: 0.2,
    boneVelocities: {}
  },
  getters: {
    getBoneById: (state) => (id) => {
      return state.bones.find(b => b && b.id === id)
    },
    getBoneChain: (state) => {
      const chain = []
      if (!state.bones || state.bones.length === 0) return chain
      
      let current = state.bones.find(b => b && !state.bones.some(bb => bb && bb.parentId === b.id))
      if (!current) {
        const validBones = state.bones.filter(b => b)
        if (validBones.length > 0) {
          current = validBones[validBones.length - 1]
        }
      }
      
      while (current) {
        chain.unshift(current)
        const next = state.bones.find(b => b && b.id === current.parentId)
        if (next === current) break
        current = next
      }
      return chain
    }
  },
  mutations: {
    SET_BONES(state, bones) {
      state.bones = bones || []
    },
    ADD_BONE(state, bone) {
      if (bone) {
        state.bones.push(bone)
      }
    },
    UPDATE_BONE(state, { id, data }) {
      if (!id || !data) return
      const index = state.bones.findIndex(b => b && b.id === id)
      if (index !== -1) {
        state.bones[index] = { ...state.bones[index], ...data }
      }
    },
    SELECT_BONE(state, boneId) {
      state.selectedBone = boneId
    },
    SET_TARGET(state, position) {
      state.targetPosition = position || { x: 400, y: 200 }
    },
    SET_SOLVER_TYPE(state, type) {
      state.solverType = type || 'ccd'
    },
    SET_MAX_ITERATIONS(state, max) {
      state.maxIterations = typeof max === 'number' ? max : 100
    },
    SET_THRESHOLD(state, threshold) {
      state.threshold = typeof threshold === 'number' ? threshold : 0.1
    },
    SET_SOLVE_RESULT(state, result) {
      state.solveResult = result
      state.errorHistory = result?.errorHistory || []
      state.constraintViolations = result?.constraintViolations || []
    },
    SET_MESH_VERTICES(state, vertices) {
      state.meshVertices = vertices || []
    },
    SET_SKIN_WEIGHTS(state, weights) {
      state.skinWeights = weights || []
    },
    SET_KEYFRAMES(state, keyframes) {
      state.keyframes = keyframes || []
    },
    ADD_KEYFRAME(state, keyframe) {
      if (keyframe) {
        state.keyframes.push(keyframe)
      }
    },
    SET_CURRENT_FRAME(state, frame) {
      state.currentFrame = typeof frame === 'number' ? frame : 0
    },
    SET_IS_PLAYING(state, isPlaying) {
      state.isPlaying = !!isPlaying
    },
    ADD_TRAIL_POINT(state, point) {
      if (point) {
        state.trailPath.push(point)
        if (state.trailPath.length > 200) {
          state.trailPath.shift()
        }
      }
    },
    CLEAR_TRAIL(state) {
      state.trailPath = []
    },
    SET_BONE_VELOCITIES(state, velocities) {
      state.boneVelocities = velocities
    }
  },
  actions: {
    saveKeyframe({ state, commit }, { frameNumber }) {
      const boneAngles = {}
      state.bones.forEach(bone => {
        boneAngles[bone.id] = bone.angle
      })
      commit('ADD_KEYFRAME', { id: Date.now(), frame_number: frameNumber, bones_angles: boneAngles })
    }
  },
  modules: {
  }
})
