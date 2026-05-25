const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db;

function initDatabase() {
  try {
    const dbDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    
    db = new Database(path.join(dbDir, 'audio-editor.db'));
    db.pragma('journal_mode = WAL');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS track_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS impulse_response_presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        samples TEXT NOT NULL,
        sample_rate INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const count = db.prepare('SELECT COUNT(*) as count FROM impulse_response_presets').get();
    if (count.count === 0) {
      insertDefaultPresets();
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function insertDefaultPresets() {
  const presets = [
    {
      name: 'Small Room',
      description: 'Natural small room reverb',
      type: 'room',
      duration: 1.5
    },
    {
      name: 'Large Hall',
      description: 'Smooth large hall reverb',
      type: 'hall',
      duration: 3.0
    },
    {
      name: 'Plate Reverb',
      description: 'Classic plate reverb sound',
      type: 'plate',
      duration: 2.0
    },
    {
      name: 'Spring Reverb',
      description: 'Vintage spring reverb',
      type: 'spring',
      duration: 1.8
    }
  ];
  
  const insert = db.prepare(`
    INSERT INTO impulse_response_presets (name, description, samples, sample_rate)
    VALUES (?, ?, ?, ?)
  `);
  
  presets.forEach(preset => {
    const samples = generateDefaultIR(preset.type, preset.duration, 44100);
    insert.run(preset.name, preset.description, JSON.stringify(samples), 44100);
  });
}

function generateDefaultIR(type, duration, sampleRate) {
  const length = Math.floor(duration * sampleRate);
  const samples = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let decay;
    
    switch (type) {
      case 'room':
        decay = Math.exp(-t * 2.5) * (1 + 0.3 * Math.sin(t * 150));
        break;
      case 'hall':
        decay = Math.exp(-t * 0.8) * (1 + 0.2 * Math.sin(t * 80));
        break;
      case 'plate':
        decay = Math.exp(-t * 1.5) * Math.cos(t * 200);
        break;
      case 'spring':
        decay = Math.exp(-t * 3) * Math.sin(t * 400 + Math.sin(t * 100) * 5);
        break;
      default:
        decay = Math.exp(-t * 2);
    }
    
    samples[i] = (Math.random() * 2 - 1) * decay * (i < 10 ? 1 - i / 10 : 1);
  }
  
  samples[0] = 1.0;
  return Array.from(samples);
}

function getTrackHistory(trackId) {
  const stmt = db.prepare('SELECT * FROM track_history WHERE track_id = ? ORDER BY timestamp DESC');
  const rows = stmt.all(trackId);
  return rows.map(row => ({
    ...row,
    data: JSON.parse(row.data)
  }));
}

function addHistoryEntry(trackId, action, data, timestamp) {
  const stmt = db.prepare(`
    INSERT INTO track_history (track_id, action, data, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(trackId, action, JSON.stringify(data), timestamp || new Date().toISOString());
  return result.lastInsertRowid;
}

function getAllImpulseResponsePresets() {
  const rows = db.prepare('SELECT * FROM impulse_response_presets ORDER BY created_at DESC').all();
  return rows.map(row => ({
    ...row,
    samples: JSON.parse(row.samples)
  }));
}

function addImpulseResponsePreset(name, description, samples, sampleRate) {
  const stmt = db.prepare(`
    INSERT INTO impulse_response_presets (name, description, samples, sample_rate)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(name, description, JSON.stringify(samples), sampleRate);
  return result.lastInsertRowid;
}

module.exports = {
  initDatabase,
  getTrackHistory,
  addHistoryEntry,
  getAllImpulseResponsePresets,
  addImpulseResponsePreset
};