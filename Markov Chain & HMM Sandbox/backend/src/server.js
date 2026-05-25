const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
const HMM = require('./algorithms/hmm')
const presets = require('./presets')

fastify.register(cors, { origin: true })

fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

fastify.post('/api/hmm/steady-state', async (request) => {
  const { states, observations, transitionMatrix, emissionMatrix, initialDistribution } = request.body
  const hmm = new HMM(states, observations, transitionMatrix, emissionMatrix, initialDistribution)
  const steadyState = hmm.steadyStateDistribution()
  
  const sumCheck = steadyState.reduce((a, b) => a + b, 0)
  const normalizedError = Math.abs(sumCheck - 1) > 0.01
  
  return {
    steadyState,
    sumCheck,
    normalizedError,
    stateLabels: states
  }
})

fastify.post('/api/hmm/viterbi', async (request) => {
  const { states, observations, transitionMatrix, emissionMatrix, initialDistribution, observationSequence } = request.body
  const hmm = new HMM(states, observations, transitionMatrix, emissionMatrix, initialDistribution)
  const result = hmm.viterbi(observationSequence)
  
  const overflowDetected = result.probability < 1e-300 || isNaN(result.probability)
  
  return {
    path: result.path,
    probability: result.probability,
    delta: result.delta,
    overflowDetected,
    observationSequence
  }
})

fastify.post('/api/hmm/posterior', async (request) => {
  const { states, observations, transitionMatrix, emissionMatrix, initialDistribution, observationSequence } = request.body
  const hmm = new HMM(states, observations, transitionMatrix, emissionMatrix, initialDistribution)
  const result = hmm.posteriorProbabilities(observationSequence)
  
  const underflowDetected = result.logLikelihood < -700
  
  return {
    gamma: result.gamma,
    alpha: result.alpha,
    beta: result.beta,
    logLikelihood: result.logLikelihood,
    underflowDetected,
    stateLabels: states
  }
})

fastify.post('/api/hmm/baum-welch', async (request) => {
  const { states, observations, transitionMatrix, emissionMatrix, initialDistribution, observationSequence, maxIterations = 50 } = request.body
  const hmm = new HMM(states, observations, JSON.parse(JSON.stringify(transitionMatrix)), JSON.parse(JSON.stringify(emissionMatrix)), initialDistribution)
  const result = hmm.baumWelch(observationSequence, maxIterations)
  
  const zeroProbTransitions = transitionMatrix.some(row => row.some(p => p === 0))
  const estimationFailed = result.likelihoodHistory.some(l => isNaN(l) || l === 0)
  const overfittingDetected = result.likelihoodHistory.length > 5 && 
    Math.abs(result.likelihoodHistory[result.likelihoodHistory.length - 1] - result.likelihoodHistory[result.likelihoodHistory.length - 2]) > 0.1
  
  return {
    learnedTransitionMatrix: result.transitionMatrix,
    learnedEmissionMatrix: result.emissionMatrix,
    learnedInitialDistribution: result.initialDistribution,
    likelihoodHistory: result.likelihoodHistory,
    zeroProbTransitions,
    estimationFailed,
    overfittingDetected
  }
})

fastify.get('/api/presets', async () => {
  return Object.values(presets).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description
  }))
})

fastify.get('/api/presets/:presetId', async (request) => {
  const preset = presets[request.params.presetId]
  if (!preset) {
    throw new Error('Preset not found')
  }
  return preset
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
