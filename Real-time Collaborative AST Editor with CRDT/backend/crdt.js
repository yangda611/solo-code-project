import * as Y from 'yjs'
import { encoding, decoding } from 'lib0'
import { saveOperation, saveSnapshot, getLatestSnapshot, getOperationCount, deleteOldOperations } from './database.js'

const documents = new Map()
const versionVectors = new Map()
const clientCursors = new Map()
const SNAPSHOT_THRESHOLD = 50

export function getOrCreateDocument(docId) {
  if (documents.has(docId)) {
    return documents.get(docId)
  }

  const ydoc = new Y.Doc()
  ydoc.gc = false
  
  const snapshot = getLatestSnapshot(docId)
  if (snapshot) {
    try {
      const update = new Uint8Array(snapshot.state)
      Y.applyUpdate(ydoc, update)
      versionVectors.set(docId, snapshot.vector)
    } catch (e) {
      console.error('Failed to load snapshot:', e)
    }
  }

  if (!versionVectors.has(docId)) {
    versionVectors.set(docId, {})
  }

  documents.set(docId, ydoc)
  return ydoc
}

export function getVersionVector(docId) {
  return versionVectors.get(docId) || {}
}

export function updateVersionVector(docId, clientId, sequence) {
  const vector = versionVectors.get(docId) || {}
  vector[clientId] = Math.max(vector[clientId] || 0, sequence)
  versionVectors.set(docId, vector)
  return vector
}

export function applyOperation(docId, clientId, operation) {
  const ydoc = getOrCreateDocument(docId)
  
  try {
    const update = new Uint8Array(operation.update)
    Y.applyUpdate(ydoc, update)
    
    const vector = updateVersionVector(docId, clientId, operation.sequence || 0)
    
    saveOperation(docId, clientId, vector, operation, operation.type || 'update')
    
    const opCount = getOperationCount(docId)
    if (opCount >= SNAPSHOT_THRESHOLD) {
      createSnapshot(docId)
    }
    
    return { success: true, vector }
  } catch (e) {
    console.error('Failed to apply operation:', e)
    return { success: false, error: e.message }
  }
}

export function createSnapshot(docId) {
  const ydoc = getOrCreateDocument(docId)
  const state = Y.encodeStateAsUpdate(ydoc)
  const vector = getVersionVector(docId)
  const opCount = getOperationCount(docId)
  
  saveSnapshot(docId, Array.from(state), vector, opCount)
  
  const snapshot = getLatestSnapshot(docId)
  if (snapshot) {
    deleteOldOperations(docId, snapshot.timestamp)
  }
}

export function getDocumentState(docId) {
  const ydoc = getOrCreateDocument(docId)
  return Y.encodeStateAsUpdate(ydoc)
}

export function resolveConflict(localOp, remoteOp, strategy = 'lww') {
  if (strategy === 'lww') {
    return localOp.timestamp > remoteOp.timestamp ? localOp : remoteOp
  } else if (strategy === 'semantic') {
    return semanticMerge(localOp, remoteOp)
  }
  return remoteOp
}

function semanticMerge(localOp, remoteOp) {
  if (localOp.type === 'add' && remoteOp.type === 'add') {
    return { type: 'merged', operations: [localOp, remoteOp] }
  }
  if (localOp.type === 'delete' && remoteOp.type === 'modify') {
    return remoteOp
  }
  if (localOp.type === 'modify' && remoteOp.type === 'delete') {
    return localOp
  }
  return localOp.timestamp > remoteOp.timestamp ? localOp : remoteOp
}

export function vectorCompare(v1, v2) {
  let v1Gt = false
  let v2Gt = false
  
  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)])
  
  for (const key of allKeys) {
    const val1 = v1[key] || 0
    const val2 = v2[key] || 0
    
    if (val1 > val2) v1Gt = true
    if (val2 > val1) v2Gt = true
  }
  
  if (v1Gt && !v2Gt) return 1
  if (v2Gt && !v1Gt) return -1
  if (!v1Gt && !v2Gt) return 0
  return null
}

export function setClientCursor(docId, clientId, cursor) {
  if (!clientCursors.has(docId)) {
    clientCursors.set(docId, new Map())
  }
  clientCursors.get(docId).set(clientId, { ...cursor, timestamp: Date.now() })
}

export function getClientCursors(docId) {
  const cursors = clientCursors.get(docId)
  if (!cursors) return {}
  const result = {}
  cursors.forEach((value, key) => {
    result[key] = value
  })
  return result
}

export { documents }
