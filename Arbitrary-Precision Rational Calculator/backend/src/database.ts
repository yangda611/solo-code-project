import Database from 'better-sqlite3';
import path from 'path';

export interface FormulaRecord {
  id?: number;
  expression: string;
  numerator: string;
  denominator: string;
  continuedFraction: string;
  createdAt?: string;
}

export interface HistoryRecord {
  id?: number;
  type: 'calculation' | 'operation';
  input: string;
  result: string;
  createdAt?: string;
}

let db: Database.Database;

export function initDatabase(dbPath?: string): Database.Database {
  const databasePath = dbPath || path.join(process.cwd(), 'data', 'calculator.db');
  db = new Database(databasePath);
  
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL,
      numerator TEXT NOT NULL,
      denominator TEXT NOT NULL,
      continued_fraction TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      input TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC)
  `);
  
  return db;
}

export function saveFormula(formula: Omit<FormulaRecord, 'id' | 'createdAt'>): number {
  const stmt = db.prepare(`
    INSERT INTO formulas (expression, numerator, denominator, continued_fraction)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(formula.expression, formula.numerator, formula.denominator, formula.continuedFraction);
  return Number(result.lastInsertRowid);
}

export function getFormulas(limit: number = 50): FormulaRecord[] {
  const stmt = db.prepare(`
    SELECT id, expression, numerator, denominator, continued_fraction as continuedFraction, created_at as createdAt
    FROM formulas
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as FormulaRecord[];
}

export function saveHistory(record: Omit<HistoryRecord, 'id' | 'createdAt'>): number {
  const stmt = db.prepare(`
    INSERT INTO history (type, input, result)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(record.type, record.input, record.result);
  return Number(result.lastInsertRowid);
}

export function getHistory(limit: number = 100): HistoryRecord[] {
  const stmt = db.prepare(`
    SELECT id, type, input, result, created_at as createdAt
    FROM history
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit) as HistoryRecord[];
}

export function clearHistory(): void {
  db.exec('DELETE FROM history');
}

export function clearFormulas(): void {
  db.exec('DELETE FROM formulas');
}

export function getDb(): Database.Database {
  return db;
}
