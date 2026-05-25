import { writable, derived, get } from 'svelte/store'
import * as Y from 'yjs'

export const clientId = writable('user-' + Math.random().toString(36).substr(2, 9))
export const docId = writable('default')
export const ydoc = new Y.Doc()
export const astRoot = ydoc.getMap('ast')
export const undoManager = new Y.UndoManager(astRoot, { captureTimeout: 500 })

export const connected = writable(false)
export const reconnecting = writable(false)
export const syncProgress = writable(0)

export const onlineUsers = writable(1)
export const userCursors = writable({})

export const operations = writable([])
export const concurrentOps = writable(0)
export const conflictResolution = writable(null)

export const versionVector = writable({})
export const intentStrategy = writable('lww')
export const semanticLossEvents = writable([])

export const timelineExpanded = writable(false)
export const showInconsistencyWindow = writable(false)

export const simulationMode = writable(null)
export const simulatedLatency = writable(0)

const pendingOps = []
let ws = null

export function initWebSocket() {
  const currentClientId = get(clientId)
  const currentDocId = get(docId)
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws?clientId=${currentClientId}&docId=${currentDocId}`
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    connected.set(true)
    reconnecting.set(false)
    syncProgress.set(100)
  }
  
  ws.onclose = () => {
    connected.set(false)
    reconnecting.set(true)
    setTimeout(() => {
      if (get(reconnecting)) {
        initWebSocket()
      }
    }, 2000)
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.type) {
      case 'init':
        handleInit(data)
        break
      case 'operation':
        handleRemoteOperation(data)
        break
      case 'presence':
        handlePresence(data)
        break
      case 'sync':
        handleSync(data)
        break
    }
  }
}

function handleInit(data) {
  const state = new Uint8Array(data.state)
  Y.applyUpdate(ydoc, state)
  versionVector.set(data.vector)
  operations.set(data.operations)
  clientId.set(data.clientId)
}

function handleRemoteOperation(data) {
  try {
    const update = new Uint8Array(data.operation.update)
    Y.applyUpdate(ydoc, update)
    
    operations.update(ops => [...ops.slice(-99), {
      ...data.operation,
      clientId: data.clientId,
      timestamp: data.timestamp,
      vector: data.vector
    }])
    
    versionVector.set(data.vector)
    concurrentOps.update(n => n + 1)
    setTimeout(() => concurrentOps.update(n => Math.max(0, n - 1)), 500)
    
    detectConflict(data)
  } catch (e) {
    console.error('Failed to apply remote update:', e)
  }
}

function handlePresence(data) {
  onlineUsers.set(data.users)
  userCursors.set(data.cursors)
}

function handleSync(data) {
  const state = new Uint8Array(data.state)
  Y.applyUpdate(ydoc, state)
  versionVector.set(data.vector)
  syncProgress.set(100)
}

function detectConflict(data) {
  const localVector = get(versionVector)
  const remoteVector = data.vector
  let hasConflict = false
  
  for (const key of Object.keys(remoteVector)) {
    if (localVector[key] !== undefined && localVector[key] < remoteVector[key]) {
      hasConflict = true
      break
    }
  }
  
  if (hasConflict) {
    conflictResolution.set({
      type: get(intentStrategy),
      localWon: data.timestamp % 2 === 0,
      timestamp: Date.now()
    })
    
    if (Math.random() < 0.3) {
      semanticLossEvents.update(events => [...events, {
        type: 'semantic_loss',
        operation: data.operation.type,
        timestamp: Date.now(),
        strategy: get(intentStrategy)
      }])
    }
    
    setTimeout(() => conflictResolution.set(null), 1000)
  }
}

export function sendOperation(operation) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    const latency = get(simulatedLatency)
    if (latency > 0) {
      pendingOps.push(operation)
      setTimeout(() => {
        if (pendingOps.length > 0 && ws.readyState === WebSocket.OPEN) {
          const op = pendingOps.shift()
          ws.send(JSON.stringify({ type: 'operation', operation: op }))
        }
      }, latency)
    } else {
      ws.send(JSON.stringify({ type: 'operation', operation }))
    }
  }
}

export function sendCursor(cursor) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'cursor', cursor }))
  }
}

export function requestSync() {
  syncProgress.set(0)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'sync' }))
  }
  let progress = 0
  const interval = setInterval(() => {
    progress += 10
    syncProgress.set(Math.min(progress, 90))
    if (progress >= 90) clearInterval(interval)
  }, 100)
}

export function undo() {
  undoManager.undo()
}

export function redo() {
  undoManager.redo()
}

let localSequence = 0
export function createASTOperation(type, payload) {
  localSequence++
  return {
    type,
    payload,
    sequence: localSequence,
    timestamp: Date.now(),
    clientId: clientId.subscribe(c => c)()
  }
}

ydoc.on('update', (update, origin) => {
  if (origin !== 'remote') {
    const op = {
      update: Array.from(update),
      sequence: localSequence,
      timestamp: Date.now()
    }
    sendOperation(op)
  }
})

export function yjsToJSON(node) {
  if (node instanceof Y.Map) {
    const obj = {}
    node.forEach((value, key) => {
      obj[key] = yjsToJSON(value)
    })
    return obj
  }
  if (node instanceof Y.Array) {
    return node.toArray().map(yjsToJSON)
  }
  if (node instanceof Y.Text) {
    return node.toString()
  }
  return node
}
