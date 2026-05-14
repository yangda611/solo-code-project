const fastify = require('fastify')({ logger: true })
const cors = require('@fastify/cors')
const { presets, fabricConfigs, loadDisplacementData } = require('./database')
const { simulateMechanics } = require('./mechanics')

fastify.register(cors, { origin: true })

fastify.get('/api/presets', async (request, reply) => {
  return presets.map((p, index) => ({
    id: index,
    name: p.name,
    config: p.config
  }))
})

fastify.get('/api/presets/:name', async (request, reply) => {
  const presetName = decodeURIComponent(request.params.name)
  const preset = presets.find(p => p.name === presetName)
  if (!preset) {
    reply.code(404)
    return { error: '预设不存在' }
  }
  return {
    id: presets.indexOf(preset),
    name: preset.name,
    config: preset.config
  }
})

fastify.post('/api/configs', async (request, reply) => {
  const config = { ...request.body, id: fabricConfigs.length, createdAt: new Date().toISOString() }
  fabricConfigs.push(config)
  return { id: config.id }
})

fastify.get('/api/configs', async (request, reply) => {
  return [...fabricConfigs].reverse()
})

fastify.post('/api/simulate', async (request, reply) => {
  const { config, loadParams } = request.body
  const results = simulateMechanics(config, loadParams)
  
  if (config.configId !== undefined) {
    results.stressStrainCurve.forEach(point => {
      loadDisplacementData.push({
        configId: config.configId,
        loadType: loadParams.loadType,
        displacement: point.strain * 100,
        stress: point.stress,
        strain: point.strain,
        timestamp: new Date().toISOString()
      })
    })
  }
  
  return results
})

fastify.get('/api/data/:configId', async (request, reply) => {
  const configId = parseInt(request.params.configId)
  return loadDisplacementData.filter(d => d.configId === configId)
})

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' })
    console.log('Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
