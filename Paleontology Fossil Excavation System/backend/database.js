import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'fossil_system.db');

let SQL = null;
let db = null;

async function initDatabase() {
  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  initPresetScenes();
  
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS stratigraphic_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      scene_type TEXT NOT NULL,
      layers TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fossil_fragments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER,
      name TEXT NOT NULL,
      bone_type TEXT NOT NULL,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      position_z REAL NOT NULL,
      rotation_x REAL NOT NULL,
      rotation_y REAL NOT NULL,
      rotation_z REAL NOT NULL,
      scale_x REAL NOT NULL DEFAULT 1,
      scale_y REAL NOT NULL DEFAULT 1,
      scale_z REAL NOT NULL DEFAULT 1,
      erosion_level REAL NOT NULL DEFAULT 0,
      weathering_level REAL NOT NULL DEFAULT 0,
      exposed_time REAL NOT NULL DEFAULT 0,
      coordinate_error_x REAL NOT NULL DEFAULT 0,
      coordinate_error_y REAL NOT NULL DEFAULT 0,
      coordinate_error_z REAL NOT NULL DEFAULT 0,
      discovered INTEGER DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES stratigraphic_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS skeleton_topology (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER,
      bone_name TEXT NOT NULL,
      parent_bone TEXT,
      joint_type TEXT,
      joint_angle_x REAL,
      joint_angle_y REAL,
      joint_angle_z REAL,
      match_confidence REAL NOT NULL DEFAULT 0,
      biomechanics_valid INTEGER DEFAULT 0,
      FOREIGN KEY (profile_id) REFERENCES stratigraphic_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS excavation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      tool_type TEXT NOT NULL,
      tool_intensity REAL NOT NULL,
      action TEXT NOT NULL,
      affected_fragment_id INTEGER,
      FOREIGN KEY (profile_id) REFERENCES stratigraphic_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      data TEXT NOT NULL
    );
  `);
}

function initPresetScenes() {
  const existingScenes = db.exec('SELECT COUNT(*) as count FROM scenes');
  if (existingScenes[0] && existingScenes[0].values[0][0] > 0) {
    return;
  }

  const presets = [
    {
      name: '三叠纪海洋沉积预设',
      type: 'triassic_ocean',
      description: '三叠纪海洋沉积物中的海生爬行动物化石',
      data: JSON.stringify({
        layers: [
          { name: '现代表层', depth: 0, color: '#8B7355', age: 0 },
          { name: '第四纪冲积层', depth: 2, color: '#A0826D', age: 2 },
          { name: '白垩纪泥灰岩', depth: 4, color: '#D4C4B0', age: 66 },
          { name: '侏罗纪页岩', depth: 6, color: '#6B5D5D', age: 145 },
          { name: '三叠纪碳酸盐岩', depth: 8, color: '#C9B896', age: 201 },
          { name: '三叠纪深海泥岩', depth: 10, color: '#4A4A4A', age: 252 }
        ],
        fragments: generateOceanFragments(),
        skeleton: generateIchthyosaurSkeleton()
      })
    },
    {
      name: '侏罗纪河流三角洲预设',
      type: 'jurassic_delta',
      description: '侏罗纪河流三角洲沉积中的蜥脚类恐龙化石',
      data: JSON.stringify({
        layers: [
          { name: '现代植被层', depth: 0, color: '#2D5A27', age: 0 },
          { name: '全新世沉积', depth: 1.5, color: '#8B7355', age: 0.01 },
          { name: '白垩纪砂岩', depth: 3.5, color: '#C2956E', age: 66 },
          { name: '侏罗纪三角洲砂岩', depth: 5.5, color: '#DEB887', age: 145 },
          { name: '侏罗纪泥岩夹层', depth: 7.5, color: '#8B7355', age: 170 },
          { name: '侏罗纪煤层', depth: 9.5, color: '#2C2C2C', age: 199 }
        ],
        fragments: generateDeltaFragments(),
        skeleton: generateSauropodSkeleton()
      })
    },
    {
      name: '白垩纪火山灰掩埋预设',
      type: 'cretaceous_volcanic',
      description: '白垩纪火山灰快速掩埋的兽脚类恐龙化石',
      data: JSON.stringify({
        layers: [
          { name: '现代土壤层', depth: 0, color: '#654321', age: 0 },
          { name: '第四纪黄土', depth: 2, color: '#D2B48C', age: 2 },
          { name: '晚白垩世火山灰层', depth: 4, color: '#E8E8E8', age: 66 },
          { name: '晚白垩世凝灰岩', depth: 6, color: '#B8A888', age: 75 },
          { name: '早白垩世沉积岩', depth: 8, color: '#A0826D', age: 145 },
          { name: '侏罗纪基底', depth: 10, color: '#696969', age: 145 }
        ],
        fragments: generateVolcanicFragments(),
        skeleton: generateTheropodSkeleton()
      })
    },
    {
      name: '冰川期冻土层预设',
      type: 'glacial_permafrost',
      description: '更新世冰川冻土层中的猛犸象化石',
      data: JSON.stringify({
        layers: [
          { name: '活动层', depth: 0, color: '#8B7355', age: 0 },
          { name: '现代冻土层', depth: 1, color: '#B0C4DE', age: 0.01 },
          { name: '晚更新世冰碛物', depth: 3, color: '#A9A9A9', age: 0.1 },
          { name: '中更新世冻土层', depth: 5, color: '#87CEEB', age: 0.5 },
          { name: '早更新世沉积物', depth: 7, color: '#D2B48C', age: 2.6 },
          { name: '上新世基底', depth: 9, color: '#8B4513', age: 5.3 }
        ],
        fragments: generatePermafrostFragments(),
        skeleton: generateMammothSkeleton()
      })
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO scenes (name, type, description, data)
    VALUES (?, ?, ?, ?)
  `);

  for (const scene of presets) {
    stmt.run([scene.name, scene.type, scene.description, scene.data]);
  }
}

function generateOceanFragments() {
  return [
    { id: 1, name: '鱼龙头骨', bone_type: 'skull', position: [-2, 3, 1], rotation: [15, 45, 0], erosion: 0, weathering: 0, layer: 5 },
    { id: 2, name: '鱼龙颈椎', bone_type: 'vertebra', position: [-1.5, 2.8, 0.8], rotation: [10, 30, 5], erosion: 0, weathering: 0, layer: 5 },
    { id: 3, name: '鱼龙胸椎', bone_type: 'vertebra', position: [-0.5, 2.5, 0.5], rotation: [5, 20, 0], erosion: 0, weathering: 0, layer: 5 },
    { id: 4, name: '鱼龙尾椎', bone_type: 'vertebra', position: [1.5, 2.2, 0], rotation: [0, -10, -5], erosion: 0, weathering: 0, layer: 5 },
    { id: 5, name: '鱼龙前鳍骨', bone_type: 'limb', position: [-1, 2, 2], rotation: [30, 60, 10], erosion: 0, weathering: 0, layer: 5 },
    { id: 6, name: '鱼龙后鳍骨', bone_type: 'limb', position: [0.5, 2.1, -1.5], rotation: [-20, -30, -10], erosion: 0, weathering: 0, layer: 5 },
    { id: 7, name: '鱼龙肋骨', bone_type: 'rib', position: [0, 2.4, 1.2], rotation: [45, 0, 20], erosion: 0, weathering: 0, layer: 5 },
    { id: 8, name: '鱼龙肋骨', bone_type: 'rib', position: [0.8, 2.3, -1], rotation: [-45, 10, -15], erosion: 0, weathering: 0, layer: 5 }
  ];
}

function generateDeltaFragments() {
  return [
    { id: 1, name: '蜥脚类头骨', bone_type: 'skull', position: [-3, 2.5, 0.5], rotation: [10, 60, 0], erosion: 0, weathering: 0, layer: 3 },
    { id: 2, name: '蜥脚类颈椎1', bone_type: 'vertebra', position: [-2, 3, 0.3], rotation: [15, 45, 5], erosion: 0, weathering: 0, layer: 3 },
    { id: 3, name: '蜥脚类颈椎2', bone_type: 'vertebra', position: [-1, 3.2, 0.1], rotation: [20, 30, 0], erosion: 0, weathering: 0, layer: 3 },
    { id: 4, name: '蜥脚类胸椎', bone_type: 'vertebra', position: [0, 2.8, 0], rotation: [5, 10, -5], erosion: 0, weathering: 0, layer: 4 },
    { id: 5, name: '蜥脚类腰椎', bone_type: 'vertebra', position: [1.5, 2.6, -0.2], rotation: [-5, 0, 0], erosion: 0, weathering: 0, layer: 4 },
    { id: 6, name: '蜥脚类前肢骨', bone_type: 'limb', position: [-1.5, 2, 1.5], rotation: [60, 20, 10], erosion: 0, weathering: 0, layer: 4 },
    { id: 7, name: '蜥脚类后肢骨', bone_type: 'limb', position: [1, 1.8, -1.5], rotation: [-70, -15, -5], erosion: 0, weathering: 0, layer: 4 },
    { id: 8, name: '蜥脚类骨盆', bone_type: 'pelvis', position: [2, 2.4, 0], rotation: [0, -45, 5], erosion: 0, weathering: 0, layer: 4 }
  ];
}

function generateVolcanicFragments() {
  return [
    { id: 1, name: '兽脚类头骨', bone_type: 'skull', position: [-1.5, 3, 0], rotation: [25, 30, 0], erosion: 0, weathering: 0, layer: 2 },
    { id: 2, name: '兽脚类颈椎', bone_type: 'vertebra', position: [-0.5, 2.8, 0.2], rotation: [15, 20, 5], erosion: 0, weathering: 0, layer: 2 },
    { id: 3, name: '兽脚类胸椎', bone_type: 'vertebra', position: [0.5, 2.6, 0], rotation: [5, 10, 0], erosion: 0, weathering: 0, layer: 2 },
    { id: 4, name: '兽脚类腰椎', bone_type: 'vertebra', position: [1.5, 2.4, -0.1], rotation: [-10, -5, -3], erosion: 0, weathering: 0, layer: 2 },
    { id: 5, name: '兽脚类前肢爪', bone_type: 'limb', position: [-1, 2.2, 1.2], rotation: [45, 45, 20], erosion: 0, weathering: 0, layer: 2 },
    { id: 6, name: '兽脚类后肢骨', bone_type: 'limb', position: [0.8, 2, -1], rotation: [-50, -20, -10], erosion: 0, weathering: 0, layer: 2 },
    { id: 7, name: '兽脚类牙齿', bone_type: 'tooth', position: [-1.8, 3.2, 0.3], rotation: [0, 0, 0], erosion: 0, weathering: 0, layer: 2 },
    { id: 8, name: '兽脚类牙齿', bone_type: 'tooth', position: [-1.6, 3.1, 0.5], rotation: [5, 10, 0], erosion: 0, weathering: 0, layer: 2 }
  ];
}

function generatePermafrostFragments() {
  return [
    { id: 1, name: '猛犸象头骨', bone_type: 'skull', position: [-2, 2.5, 0], rotation: [20, 50, 0], erosion: 0, weathering: 0, layer: 2 },
    { id: 2, name: '猛犸象牙', bone_type: 'tusk', position: [-1.5, 2.8, 0.8], rotation: [30, 60, 10], erosion: 0, weathering: 0, layer: 2 },
    { id: 3, name: '猛犸象牙', bone_type: 'tusk', position: [-2.5, 2.7, -0.8], rotation: [25, -60, -10], erosion: 0, weathering: 0, layer: 2 },
    { id: 4, name: '猛犸象颈椎', bone_type: 'vertebra', position: [-0.5, 2.3, 0.2], rotation: [10, 30, 5], erosion: 0, weathering: 0, layer: 3 },
    { id: 5, name: '猛犸象胸椎', bone_type: 'vertebra', position: [0.5, 2.1, 0], rotation: [5, 15, 0], erosion: 0, weathering: 0, layer: 3 },
    { id: 6, name: '猛犸象前腿骨', bone_type: 'limb', position: [-1, 1.8, 1.5], rotation: [70, 30, 15], erosion: 0, weathering: 0, layer: 3 },
    { id: 7, name: '猛犸象后腿骨', bone_type: 'limb', position: [1, 1.7, -1.2], rotation: [-75, -25, -10], erosion: 0, weathering: 0, layer: 3 },
    { id: 8, name: '猛犸象骨盆', bone_type: 'pelvis', position: [1.8, 2, -0.3], rotation: [0, -40, 5], erosion: 0, weathering: 0, layer: 3 }
  ];
}

function generateIchthyosaurSkeleton() {
  return [
    { bone: 'skull', parent: null, joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'cervical_vertebra', parent: 'skull', joint: 'hinge', angles: [15, 0, 0] },
    { bone: 'thoracic_vertebra', parent: 'cervical_vertebra', joint: 'ball', angles: [5, 0, 0] },
    { bone: 'lumbar_vertebra', parent: 'thoracic_vertebra', joint: 'ball', angles: [0, 0, 0] },
    { bone: 'caudal_vertebra', parent: 'lumbar_vertebra', joint: 'hinge', angles: [-10, 0, 0] },
    { bone: 'anterior_flipper', parent: 'thoracic_vertebra', joint: 'ball', angles: [30, 45, 10] },
    { bone: 'posterior_flipper', parent: 'lumbar_vertebra', joint: 'ball', angles: [-20, -30, 0] },
    { bone: 'ribs', parent: 'thoracic_vertebra', joint: 'hinge', angles: [45, 0, 0] }
  ];
}

function generateSauropodSkeleton() {
  return [
    { bone: 'skull', parent: 'cervical_vertebra_7', joint: 'hinge', angles: [10, 0, 0] },
    { bone: 'cervical_vertebra_1', parent: 'cervical_vertebra_2', joint: 'ball', angles: [15, 5, 0] },
    { bone: 'cervical_vertebra_2', parent: 'cervical_vertebra_3', joint: 'ball', angles: [12, 3, 0] },
    { bone: 'cervical_vertebra_7', parent: 'thoracic_vertebra_1', joint: 'ball', angles: [5, 0, 0] },
    { bone: 'thoracic_vertebra_1', parent: 'lumbar_vertebra', joint: 'ball', angles: [0, 0, 0] },
    { bone: 'lumbar_vertebra', parent: 'pelvis', joint: 'ball', angles: [0, 0, 0] },
    { bone: 'pelvis', parent: null, joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'forelimb', parent: 'thoracic_vertebra_1', joint: 'ball', angles: [60, 20, 0] },
    { bone: 'hindlimb', parent: 'pelvis', joint: 'ball', angles: [-70, 0, 0] }
  ];
}

function generateTheropodSkeleton() {
  return [
    { bone: 'skull', parent: 'cervical_vertebra', joint: 'ball', angles: [20, 0, 0] },
    { bone: 'cervical_vertebra', parent: 'thoracic_vertebra', joint: 'ball', angles: [15, 10, 0] },
    { bone: 'thoracic_vertebra', parent: 'sacrum', joint: 'ball', angles: [5, 0, 0] },
    { bone: 'sacrum', parent: 'pelvis', joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'pelvis', parent: null, joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'caudal_vertebra', parent: 'sacrum', joint: 'ball', angles: [-15, 0, 0] },
    { bone: 'forelimb', parent: 'thoracic_vertebra', joint: 'ball', angles: [45, 45, 20] },
    { bone: 'hindlimb', parent: 'pelvis', joint: 'ball', angles: [-50, 0, 0] }
  ];
}

function generateMammothSkeleton() {
  return [
    { bone: 'skull', parent: 'cervical_vertebra', joint: 'ball', angles: [25, 0, 0] },
    { bone: 'tusk_left', parent: 'skull', joint: 'fixed', angles: [30, 30, 10] },
    { bone: 'tusk_right', parent: 'skull', joint: 'fixed', angles: [25, -30, -10] },
    { bone: 'cervical_vertebra', parent: 'thoracic_vertebra', joint: 'ball', angles: [15, 0, 0] },
    { bone: 'thoracic_vertebra', parent: 'sacrum', joint: 'ball', angles: [5, 0, 0] },
    { bone: 'sacrum', parent: 'pelvis', joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'pelvis', parent: null, joint: 'fixed', angles: [0, 0, 0] },
    { bone: 'caudal_vertebra', parent: 'sacrum', joint: 'ball', angles: [-20, 0, 0] },
    { bone: 'forelimb', parent: 'thoracic_vertebra', joint: 'ball', angles: [70, 0, 0] },
    { bone: 'hindlimb', parent: 'pelvis', joint: 'ball', angles: [-75, 0, 0] }
  ];
}

function getAllScenes() {
  const result = db.exec('SELECT id, name, type, description FROM scenes');
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

function getSceneByName(name) {
  const result = db.exec('SELECT * FROM scenes WHERE name = ?', [name]);
  if (!result.length) return null;
  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj = {};
  columns.forEach((col, i) => obj[col] = row[i]);
  obj.data = JSON.parse(obj.data);
  return obj;
}

function createProfile(profile) {
  const stmt = db.prepare(`
    INSERT INTO stratigraphic_profiles (name, scene_type, layers, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);
  stmt.run([profile.name, profile.scene_type, JSON.stringify(profile.layers)]);
  saveDatabase();
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

function getProfile(id) {
  const result = db.exec('SELECT * FROM stratigraphic_profiles WHERE id = ?', [id]);
  if (!result.length) return null;
  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj = {};
  columns.forEach((col, i) => obj[col] = row[i]);
  obj.layers = JSON.parse(obj.layers);
  return obj;
}

function addFragments(profileId, fragments) {
  const stmt = db.prepare(`
    INSERT INTO fossil_fragments (
      profile_id, name, bone_type,
      position_x, position_y, position_z,
      rotation_x, rotation_y, rotation_z,
      scale_x, scale_y, scale_z,
      erosion_level, weathering_level, exposed_time,
      coordinate_error_x, coordinate_error_y, coordinate_error_z,
      discovered
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of fragments) {
    const pos = f.position || [0, 0, 0];
    const rot = f.rotation || [0, 0, 0];
    const scale = f.scale || [1, 1, 1];
    const err = f.coordinateError || [0, 0, 0];
    
    stmt.run([
      profileId, f.name, f.bone_type,
      pos[0], pos[1], pos[2],
      rot[0], rot[1], rot[2],
      scale[0], scale[1], scale[2],
      f.erosion || 0, f.weathering || 0, f.exposedTime || 0,
      err[0], err[1], err[2],
      f.discovered ? 1 : 0
    ]);
  }
  saveDatabase();
}

function getFragments(profileId) {
  const result = db.exec('SELECT * FROM fossil_fragments WHERE profile_id = ?', [profileId]);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

function updateFragment(id, updates) {
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  const query = `UPDATE fossil_fragments SET ${fields.join(', ')} WHERE id = ?`;
  db.prepare(query).run(values);
  saveDatabase();
}

function addTopology(profileId, topologies) {
  const stmt = db.prepare(`
    INSERT INTO skeleton_topology (
      profile_id, bone_name, parent_bone, joint_type,
      joint_angle_x, joint_angle_y, joint_angle_z,
      match_confidence, biomechanics_valid
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of topologies) {
    const angles = t.angles || [0, 0, 0];
    stmt.run([
      profileId, t.bone, t.parent || null, t.joint || 'fixed',
      angles[0], angles[1], angles[2],
      t.confidence || 0, t.biomechanicsValid ? 1 : 0
    ]);
  }
  saveDatabase();
}

function getTopology(profileId) {
  const result = db.exec('SELECT * FROM skeleton_topology WHERE profile_id = ?', [profileId]);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

function addLog(profileId, log) {
  const stmt = db.prepare(`
    INSERT INTO excavation_logs (
      profile_id, timestamp, tool_type, tool_intensity, action, affected_fragment_id
    ) VALUES (?, datetime('now'), ?, ?, ?, ?)
  `);
  
  stmt.run([profileId, log.toolType, log.intensity, log.action, log.fragmentId || null]);
  saveDatabase();
}

function getLogs(profileId) {
  const result = db.exec('SELECT * FROM excavation_logs WHERE profile_id = ? ORDER BY timestamp ASC', [profileId]);
  if (!result.length) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

export {
  initDatabase,
  getAllScenes,
  getSceneByName,
  createProfile,
  getProfile,
  addFragments,
  getFragments,
  updateFragment,
  addTopology,
  getTopology,
  addLog,
  getLogs
};
