import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyWebsocket from '@fastify/websocket'
import path from 'path'
import { fileURLToPath } from 'url'
import { applyOperation, getDocumentState, getVersionVector, getOrCreateDocument, setClientCursor, getClientCursors, createSnapshot } from './crdt.js'
import { getOperations } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger: true })

await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'dist'),
  prefix: '/'
})

await fastify.register(fastifyWebsocket)

const connections = new Map()

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = req.query.clientId || 'anonymous-' + Math.random().toString(36).substr(2, 9)
    const docId = req.query.docId || 'default'
    
    if (!connections.has(docId)) {
      connections.set(docId, new Set())
    }
    connections.get(docId).add(connection)
    
    fastify.log.info(`Client ${clientId} connected to document ${docId}`)
    
    const ydoc = getOrCreateDocument(docId)
    const state = getDocumentState(docId)
    const vector = getVersionVector(docId)
    const ops = getOperations(docId, Date.now() - 3600000)
    
    connection.socket.send(JSON.stringify({
      type: 'init',
      state: Array.from(state),
      vector,
      operations: ops.slice(-100),
      clientId
    }))
    
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        
        switch (data.type) {
          case 'operation':
            handleOperation(clientId, docId, data, connection)
            break
          case 'cursor':
            handleCursor(clientId, docId, data)
            break
          case 'sync':
            handleSync(clientId, docId, connection)
            break
          case 'snapshot':
            createSnapshot(docId)
            break
        }
      } catch (e) {
        fastify.log.error('Error processing message:', e)
      }
    })
    
    connection.socket.on('close', () => {
      fastify.log.info(`Client ${clientId} disconnected from document ${docId}`)
      const docConnections = connections.get(docId)
      if (docConnections) {
        docConnections.delete(connection)
        if (docConnections.size === 0) {
          connections.delete(docId)
        }
      }
      broadcastPresence(docId)
    })
    
    broadcastPresence(docId)
  })
})

function handleOperation(clientId, docId, data, sourceConnection) {
  const result = applyOperation(docId, clientId, data.operation)
  
  if (result.success) {
    const docConnections = connections.get(docId)
    if (docConnections) {
      docConnections.forEach(conn => {
        if (conn !== sourceConnection) {
          conn.socket.send(JSON.stringify({
            type: 'operation',
            clientId,
            operation: data.operation,
            vector: result.vector,
            timestamp: Date.now()
          }))
        }
      })
    }
  }
}

function handleCursor(clientId, docId, data) {
  setClientCursor(docId, clientId, data.cursor)
  broadcastPresence(docId)
}

function handleSync(clientId, docId, connection) {
  const state = getDocumentState(docId)
  const vector = getVersionVector(docId)
  
  connection.socket.send(JSON.stringify({
    type: 'sync',
    state: Array.from(state),
    vector,
    timestamp: Date.now()
  }))
}

function broadcastPresence(docId) {
  const docConnections = connections.get(docId)
  if (!docConnections) return
  
  const cursors = getClientCursors(docId)
  const userCount = docConnections.size
  
  docConnections.forEach(conn => {
    conn.socket.send(JSON.stringify({
      type: 'presence',
      users: userCount,
      cursors
    }))
  })
}

fastify.get('/api/operations/:docId', async (request, reply) => {
  const { docId } = request.params
  const { since } = request.query
  const ops = getOperations(docId, since ? parseInt(since) : 0)
  return { operations: ops }
})

fastify.post('/api/snapshot/:docId', async (request, reply) => {
  const { docId } = request.params
  createSnapshot(docId)
  return { success: true }
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
