const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'submersible.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到 SQLite 数据库');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        density REAL NOT NULL,
        youngs_modulus REAL NOT NULL,
        poisson_ratio REAL NOT NULL,
        yield_strength REAL NOT NULL,
        ultimate_strength REAL NOT NULL,
        fracture_toughness REAL NOT NULL,
        fatigue_coefficient REAL NOT NULL,
        fatigue_exponent REAL NOT NULL,
        ductile_brittle_transition REAL NOT NULL,
        thermal_expansion REAL NOT NULL,
        cost_per_kg REAL NOT NULL,
        description TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        outer_radius REAL NOT NULL,
        inner_radius REAL NOT NULL,
        length REAL NOT NULL,
        thickness REAL NOT NULL,
        window_diameter REAL NOT NULL,
        window_count INTEGER NOT NULL,
        rib_count INTEGER NOT NULL,
        rib_spacing REAL NOT NULL,
        rib_height REAL NOT NULL,
        material_id INTEGER,
        end_cap_type TEXT DEFAULT 'hemispherical',
        weld_quality TEXT DEFAULT 'class_a',
        surface_roughness REAL DEFAULT 0.8,
        notes TEXT,
        FOREIGN KEY (material_id) REFERENCES materials(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS simulation_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        design_id INTEGER NOT NULL,
        depth REAL NOT NULL,
        external_pressure REAL NOT NULL,
        temperature REAL NOT NULL,
        max_hoop_stress REAL NOT NULL,
        max_longitudinal_stress REAL NOT NULL,
        max_radial_stress REAL NOT NULL,
        max_von_mises_stress REAL NOT NULL,
        max_deformation REAL NOT NULL,
        stress_concentration_factor REAL NOT NULL,
        safety_factor REAL NOT NULL,
        fatigue_life_cycles REAL NOT NULL,
        failure_mode TEXT,
        burst_pressure REAL,
        critical_buckling_pressure REAL,
        result_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (design_id) REFERENCES designs(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        target_depth REAL NOT NULL,
        design_config TEXT NOT NULL,
        is_builtin INTEGER DEFAULT 0
      )
    `);

    insertDefaultMaterials();
    insertDefaultPresets();
  });
}

function insertDefaultMaterials() {
  const materials = [
    [
      '钛合金 Ti-6Al-4V',
      4430,
      114e9,
      0.33,
      880e6,
      950e6,
      75e6,
      1200e6,
      -0.12,
      153,
      8.6e-6,
      25.5,
      '航空航天和深海潜水器标准材料，高强度重量比'
    ],
    [
      '高强度钢 HY-80',
      7850,
      205e9,
      0.29,
      550e6,
      650e6,
      150e6,
      1500e6,
      -0.10,
      200,
      11.7e-6,
      2.8,
      '海军舰艇和潜艇标准钢'
    ],
    [
      '马氏体时效钢 18Ni',
      8000,
      185e9,
      0.30,
      1500e6,
      1650e6,
      130e6,
      2000e6,
      -0.08,
      220,
      10.3e-6,
      18.0,
      '超高强度钢，用于超深潜'
    ],
    [
      '铝合金 7075-T6',
      2810,
      71.7e9,
      0.33,
      505e6,
      572e6,
      28e6,
      800e6,
      -0.15,
      250,
      23.4e-6,
      4.5,
      '轻质铝合金，浅海应用'
    ],
    [
      '不锈钢 316L',
      7980,
      193e9,
      0.27,
      290e6,
      515e6,
      85e6,
      1000e6,
      -0.13,
      180,
      16.0e-6,
      6.2,
      '耐腐蚀不锈钢'
    ],
    [
      '碳纤维复合材料',
      1550,
      150e9,
      0.28,
      1200e6,
      1500e6,
      45e6,
      2500e6,
      -0.07,
      273,
      2.0e-6,
      35.0,
      '先进复合材料，极高强度重量比'
    ]
  ];

  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM materials');
  checkStmt.get((err, row) => {
    if (err) {
      console.error('检查材料表错误:', err);
      return;
    }

    if (row.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO materials (
          name, density, youngs_modulus, poisson_ratio, yield_strength,
          ultimate_strength, fracture_toughness, fatigue_coefficient,
          fatigue_exponent, ductile_brittle_transition, thermal_expansion,
          cost_per_kg, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      db.serialize(() => {
        for (const mat of materials) {
          insertStmt.run(...mat);
        }
        console.log('默认材料数据已插入');
      });
    }
  });
}

function insertDefaultPresets() {
  const presets = [
    [
      '浅海科考预设',
      '适用于200米以内的科学考察任务，中等压力环境',
      '🔬',
      200,
      JSON.stringify({
        outerRadius: 1.2,
        innerRadius: 1.1,
        length: 4.0,
        thickness: 0.1,
        windowDiameter: 0.4,
        windowCount: 4,
        ribCount: 8,
        ribSpacing: 0.5,
        ribHeight: 0.05,
        material: '钛合金 Ti-6Al-4V',
        endCapType: 'hemispherical',
        weldQuality: 'class_a'
      })
    ],
    [
      '深海沟探测预设',
      '适用于6000米深度的海沟探测，高压环境',
      '🌊',
      6000,
      JSON.stringify({
        outerRadius: 1.0,
        innerRadius: 0.82,
        length: 3.5,
        thickness: 0.18,
        windowDiameter: 0.25,
        windowCount: 2,
        ribCount: 12,
        ribSpacing: 0.3,
        ribHeight: 0.08,
        material: '马氏体时效钢 18Ni',
        endCapType: 'hemispherical',
        weldQuality: 'class_aa'
      })
    ],
    [
      '超深渊挑战预设',
      '挑战马里亚纳海沟11000米极限深度',
      '🏆',
      11000,
      JSON.stringify({
        outerRadius: 0.85,
        innerRadius: 0.6,
        length: 2.8,
        thickness: 0.25,
        windowDiameter: 0.15,
        windowCount: 1,
        ribCount: 16,
        ribSpacing: 0.2,
        ribHeight: 0.12,
        material: '马氏体时效钢 18Ni',
        endCapType: 'spherical',
        weldQuality: 'class_aa'
      })
    ],
    [
      '紧急上浮预设',
      '快速上浮模拟，验证应力循环和疲劳特性',
      '⬆️',
      500,
      JSON.stringify({
        outerRadius: 1.1,
        innerRadius: 0.98,
        length: 3.8,
        thickness: 0.12,
        windowDiameter: 0.35,
        windowCount: 3,
        ribCount: 10,
        ribSpacing: 0.4,
        ribHeight: 0.06,
        material: '高强度钢 HY-80',
        endCapType: 'ellipsoidal',
        weldQuality: 'class_b'
      })
    ]
  ];

  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM presets');
  checkStmt.get((err, row) => {
    if (err) {
      console.error('检查预设表错误:', err);
      return;
    }

    if (row.count === 0) {
      const insertStmt = db.prepare(`
        INSERT INTO presets (name, description, icon, target_depth, design_config, is_builtin)
        VALUES (?, ?, ?, ?, ?, 1)
      `);

      db.serialize(() => {
        for (const preset of presets) {
          insertStmt.run(...preset);
        }
        console.log('默认预设数据已插入');
      });
    }
  });
}

module.exports = db;
