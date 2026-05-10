const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const mechanics = require('./mechanics');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '深海潜水器压力分析服务运行中' });
});

app.get('/api/materials', (req, res) => {
  db.all('SELECT * FROM materials', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/materials/:id', (req, res) => {
  db.get('SELECT * FROM materials WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      return res.status(404).json({ error: '材料未找到' });
    }
    res.json(row);
  });
});

app.get('/api/presets', (req, res) => {
  db.all('SELECT * FROM presets', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(p => ({
      ...p,
      design_config: JSON.parse(p.design_config)
    })));
  });
});

app.get('/api/presets/:id', (req, res) => {
  db.get('SELECT * FROM presets WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      return res.status(404).json({ error: '预设未找到' });
    }
    res.json({
      ...row,
      design_config: JSON.parse(row.design_config)
    });
  });
});

app.post('/api/analyze', (req, res) => {
  try {
    const { design, depth, temperature = 273.15 } = req.body;

    if (!design || !design.material) {
      return res.status(400).json({ error: '设计参数和材料信息必填' });
    }

    const result = mechanics.analyzeStructure(design, depth, temperature);

    res.json(result);
  } catch (error) {
    console.error('分析错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/batch', (req, res) => {
  try {
    const { design, depths, temperature = 273.15 } = req.body;

    if (!design || !design.material || !Array.isArray(depths)) {
      return res.status(400).json({ error: '设计参数、材料和深度数组必填' });
    }

    const results = depths.map(depth => mechanics.analyzeStructure(design, depth, temperature));

    res.json(results);
  } catch (error) {
    console.error('批量分析错误:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/designs', (req, res) => {
  const query = `
    SELECT d.*, m.name as material_name
    FROM designs d
    LEFT JOIN materials m ON d.material_id = m.id
    ORDER BY d.updated_at DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/designs', (req, res) => {
  const {
    name, outer_radius, inner_radius, length, thickness,
    window_diameter, window_count, rib_count, rib_spacing, rib_height,
    material_id, end_cap_type, weld_quality, notes
  } = req.body;

  const query = `
    INSERT INTO designs (
      name, outer_radius, inner_radius, length, thickness,
      window_diameter, window_count, rib_count, rib_spacing, rib_height,
      material_id, end_cap_type, weld_quality, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    name || '未命名设计', outer_radius, inner_radius, length, thickness,
    window_diameter, window_count, rib_count, rib_spacing, rib_height,
    material_id || null, end_cap_type || 'hemispherical', weld_quality || 'class_a', notes || ''
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, success: true });
  });
});

app.put('/api/designs/:id', (req, res) => {
  const {
    name, outer_radius, inner_radius, length, thickness,
    window_diameter, window_count, rib_count, rib_spacing, rib_height,
    material_id, end_cap_type, weld_quality, notes
  } = req.body;

  const query = `
    UPDATE designs SET
      name = ?, outer_radius = ?, inner_radius = ?, length = ?, thickness = ?,
      window_diameter = ?, window_count = ?, rib_count = ?, rib_spacing = ?, rib_height = ?,
      material_id = ?, end_cap_type = ?, weld_quality = ?, notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [
    name, outer_radius, inner_radius, length, thickness,
    window_diameter, window_count, rib_count, rib_spacing, rib_height,
    material_id, end_cap_type, weld_quality, notes, req.params.id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '设计未找到' });
    }
    res.json({ success: true });
  });
});

app.delete('/api/designs/:id', (req, res) => {
  db.run('DELETE FROM designs WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '设计未找到' });
    }
    res.json({ success: true });
  });
});

app.get('/api/simulations', (req, res) => {
  const query = `
    SELECT sr.*, d.name as design_name
    FROM simulation_results sr
    LEFT JOIN designs d ON sr.design_id = d.id
    ORDER BY sr.created_at DESC
    LIMIT 100
  `;
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/simulations', (req, res) => {
  const {
    design_id, depth, external_pressure, temperature,
    max_hoop_stress, max_longitudinal_stress, max_radial_stress,
    max_von_mises_stress, max_deformation, stress_concentration_factor,
    safety_factor, fatigue_life_cycles, failure_mode,
    burst_pressure, critical_buckling_pressure, result_data
  } = req.body;

  const query = `
    INSERT INTO simulation_results (
      design_id, depth, external_pressure, temperature,
      max_hoop_stress, max_longitudinal_stress, max_radial_stress,
      max_von_mises_stress, max_deformation, stress_concentration_factor,
      safety_factor, fatigue_life_cycles, failure_mode,
      burst_pressure, critical_buckling_pressure, result_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [
    design_id, depth, external_pressure, temperature,
    max_hoop_stress, max_longitudinal_stress, max_radial_stress,
    max_von_mises_stress, max_deformation, stress_concentration_factor,
    safety_factor, fatigue_life_cycles, failure_mode || '',
    burst_pressure, critical_buckling_pressure, result_data || ''
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, success: true });
  });
});

app.get('/api/simulations/design/:designId', (req, res) => {
  const query = `
    SELECT * FROM simulation_results
    WHERE design_id = ?
    ORDER BY depth ASC
  `;
  db.all(query, [req.params.designId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/stats/summary', (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as count FROM designs', (err, dRow) => {
      db.get('SELECT COUNT(*) as count FROM simulation_results', (err, sRow) => {
        db.get('SELECT COUNT(*) as count FROM materials', (err, mRow) => {
          db.get('SELECT MAX(depth) as max_depth FROM simulation_results', (err, mdRow) => {
            db.get('SELECT AVG(safety_factor) as avg_safety FROM simulation_results', (err, avgRow) => {
              res.json({
                designCount: dRow ? dRow.count : 0,
                simulationCount: sRow ? sRow.count : 0,
                materialCount: mRow ? mRow.count : 0,
                maxDepth: mdRow ? mdRow.max_depth || 0 : 0,
                avgSafety: avgRow ? avgRow.avg_safety || 0 : 0
              });
            });
          });
        });
      });
    });
  });
});

app.get('/api/export/materials', (req, res) => {
  db.all('SELECT * FROM materials', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=materials.json');
    res.json(rows);
  });
});

const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`深海潜水器压力分析服务已启动: http://localhost:${PORT}`);
  console.log(`API健康检查: http://localhost:${PORT}/api/health`);
});

module.exports = app;
