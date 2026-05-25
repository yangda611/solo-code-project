import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../parser.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS parse_sessions (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_chunks INTEGER DEFAULT 0,
    processed_chunks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS parse_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    chunk_index INTEGER,
    state TEXT,
    buffer TEXT,
    stack TEXT,
    position INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES parse_sessions(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    chunk_index INTEGER,
    type TEXT,
    value TEXT,
    start_pos INTEGER,
    end_pos INTEGER,
    path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES parse_sessions(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS ast_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    node_id TEXT,
    type TEXT,
    parent_id TEXT,
    path TEXT,
    value TEXT,
    depth INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES parse_sessions(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    chunk_index INTEGER,
    position INTEGER,
    message TEXT,
    severity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES parse_sessions(id)
  )
`)

export function createSession(sessionId, totalChunks) {
  const stmt = db.prepare('INSERT INTO parse_sessions (id, total_chunks) VALUES (?, ?)')
  return stmt.run(sessionId, totalChunks)
}

export function saveParseState(sessionId, chunkIndex, state) {
  const stmt = db.prepare(`
    INSERT INTO parse_states (session_id, chunk_index, state, buffer, stack, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    sessionId,
    chunkIndex,
    state.state,
    state.buffer,
    JSON.stringify(state.stack),
    state.position
  )
}

export function getLastParseState(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM parse_states
    WHERE session_id = ?
    ORDER BY chunk_index DESC
    LIMIT 1
  `)
  const result = stmt.get(sessionId)
  if (result) {
    result.stack = JSON.parse(result.stack)
  }
  return result
}

export function saveToken(sessionId, chunkIndex, token, path) {
  const stmt = db.prepare(`
    INSERT INTO tokens (session_id, chunk_index, type, value, start_pos, end_pos, path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    sessionId,
    chunkIndex,
    token.type,
    token.value,
    token.start,
    token.end,
    path
  )
}

export function saveAstNode(sessionId, node) {
  const stmt = db.prepare(`
    INSERT INTO ast_nodes (session_id, node_id, type, parent_id, path, value, depth)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  return stmt.run(
    sessionId,
    node.id,
    node.type,
    node.parentId,
    node.path,
    node.value,
    node.depth
  )
}

export function saveError(sessionId, chunkIndex, position, message, severity = 'error') {
  const stmt = db.prepare(`
    INSERT INTO errors (session_id, chunk_index, position, message, severity)
    VALUES (?, ?, ?, ?, ?)
  `)
  return stmt.run(sessionId, chunkIndex, position, message, severity)
}

export function getSessionTokens(sessionId) {
  const stmt = db.prepare('SELECT * FROM tokens WHERE session_id = ? ORDER BY start_pos')
  return stmt.all(sessionId)
}

export function getSessionAstNodes(sessionId) {
  const stmt = db.prepare('SELECT * FROM ast_nodes WHERE session_id = ? ORDER BY depth, id')
  return stmt.all(sessionId)
}

export function updateSessionProgress(sessionId, processedChunks) {
  const stmt = db.prepare('UPDATE parse_sessions SET processed_chunks = ? WHERE id = ?')
  return stmt.run(processedChunks, sessionId)
}

export function getSession(sessionId) {
  const stmt = db.prepare('SELECT * FROM parse_sessions WHERE id = ?')
  return stmt.get(sessionId)
}

export function getSessionErrors(sessionId) {
  const stmt = db.prepare('SELECT * FROM errors WHERE session_id = ? ORDER BY created_at')
  return stmt.all(sessionId)
}

export default db