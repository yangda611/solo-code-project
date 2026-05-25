import { reactive } from 'vue'

export const store = reactive({
  currentModel: {
    name: '默认模型',
    states: ['S0', 'S1', 'S2'],
    observations: ['O0', 'O1'],
    transitionMatrix: [
      [0.5, 0.3, 0.2],
      [0.2, 0.6, 0.2],
      [0.1, 0.2, 0.7]
    ],
    emissionMatrix: [
      [0.7, 0.3],
      [0.4, 0.6],
      [0.2, 0.8]
    ],
    initialDistribution: [0.4, 0.3, 0.3],
    observationSequence: ['O0', 'O0', 'O1', 'O0', 'O1', 'O1', 'O0', 'O1']
  },

  setModel(model) {
    this.currentModel = { ...model }
  },

  updateTransitionMatrix(row, col, value) {
    this.currentModel.transitionMatrix[row][col] = parseFloat(value) || 0
  },

  updateEmissionMatrix(row, col, value) {
    this.currentModel.emissionMatrix[row][col] = parseFloat(value) || 0
  },

  updateInitialDistribution(index, value) {
    this.currentModel.initialDistribution[index] = parseFloat(value) || 0
  },

  addState(name) {
    const n = this.currentModel.states.length
    this.currentModel.states.push(name)
    this.currentModel.initialDistribution.push(1 / (n + 1))
    this.currentModel.transitionMatrix.forEach(row => row.push(0))
    this.currentModel.transitionMatrix.push(Array(n + 1).fill(1 / (n + 1)))
    this.currentModel.emissionMatrix.push(
      Array(this.currentModel.observations.length).fill(1 / this.currentModel.observations.length)
    )
  },

  addObservation(name) {
    this.currentModel.observations.push(name)
    this.currentModel.emissionMatrix.forEach(row => row.push(1 / this.currentModel.observations.length))
  }
})
