import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '..', 'ast-editor.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    vector TEXT NOT NULL,
    operation TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    type TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id TEXT NOT NULL,
    state TEXT NOT NULL,
    vector TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    operation_count INTEGER NOT NULL
  )
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ops_doc_time ON operations(doc_id, timestamp)
`)

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_snapshots_doc_time ON snapshots(doc_id, timestamp DESC)
`)

export function saveOperation(docId, clientId, vector, operation, type) {
  const stmt = db.prepare(`
    INSERT INTO operations (doc_id, client_id, vector, operation, timestamp, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(docId, clientId, JSON.stringify(vector), JSON.stringify(operation), Date.now(), type)
}

export function getOperations(docId, sinceTimestamp = 0) {
  const stmt = db.prepare(`
    SELECT * FROM operations
    WHERE doc_id = ? AND timestamp > ?
    ORDER BY timestamp ASC
  `)
  const rows = stmt.all(docId, sinceTimestamp)
  return rows.map(row => ({
    ...row,
    vector: JSON.parse(row.vector),
    operation: JSON.parse(row.operation)
  }))
}

export function saveSnapshot(docId, state, vector, operationCount) {
  const stmt = db.prepare(`
    INSERT INTO snapshots (doc_id, state, vector, timestamp, operation_count)
    VALUES (?, ?, ?, ?, ?)
  `)
  return stmt.run(docId, JSON.stringify(state), JSON.stringify(vector), Date.now(), operationCount)
}

export function getLatestSnapshot(docId) {
  const stmt = db.prepare(`
    SELECT * FROM snapshots
    WHERE doc_id = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `)
  const row = stmt.get(docId)
  if (!row) return null
  return {
    ...row,
    state: JSON.parse(row.state),
    vector: JSON.parse(row.vector)
  }
}

export function getOperationCount(docId) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM operations WHERE doc_id = ?')
  return stmt.get(docId).count
}

export function deleteOldOperations(docId, beforeTimestamp) {
  const stmt = db.prepare('DELETE FROM operations WHERE doc_id = ? AND timestamp < ?')
  return stmt.run(docId, beforeTimestamp)
}

export default db
