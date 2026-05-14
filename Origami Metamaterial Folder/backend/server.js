const express = require('express');
const cors = require('cors');
const db = require('./database');
const SphericalLinkageSolver = require('./kinematics');
const BistableEnergyAnalyzer = require('./energyAnalysis');
const presets = require('./presets');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/presets', (req, res) => {
  res.json(presets);
});

app.get('/api/presets/:name', (req, res) => {
  const name = req.params.name;
  if (presets[name]) {
    res.json(presets[name]);
  } else {
    res.status(404).json({ error: '预设不存在' });
  }
});

app.post('/api/crease-patterns', (req, res) => {
  const { name, vertices, edges, faces, panelThickness } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO crease_patterns (name, vertices, edges, faces, panel_thickness)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    name,
    JSON.stringify(vertices),
    JSON.stringify(edges),
    JSON.stringify(faces),
    panelThickness || 0.1
  );
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/crease-patterns', (req, res) => {
  const patterns = db.prepare('SELECT * FROM crease_patterns ORDER BY created_at DESC').all();
  res.json(patterns.map(p => ({
    ...p,
    vertices: JSON.parse(p.vertices),
    edges: JSON.parse(p.edges),
    faces: JSON.parse(p.faces)
  })));
});

app.post('/api/analyze/kinematics', (req, res) => {
  const { vertices, edges, faces, thickness } = req.body;
  
  const solver = new SphericalLinkageSolver(vertices, edges, faces);
  const foldability = solver.checkRigidFoldability();
  const dihedralAngles = solver.computeDihedralAngles(0);
  const interferences = solver.detectThicknessInterference(thickness || 0.1);
  const overconstraints = solver.detectOverconstraints();
  
  res.json({
    ...foldability,
    dihedralAngles,
    interferences,
    overconstraints
  });
});

app.post('/api/analyze/energy', (req, res) => {
  const { vertices, edges, faces, thickness, resolution } = req.body;
  
  const analyzer = new BistableEnergyAnalyzer(vertices, edges, faces, thickness || 0.1);
  const energyLandscape = analyzer.computeEnergyLandscape(resolution || 15);
  const foldingSequence = analyzer.generateFoldingSequence(50);
  
  const hasAccidentalJump = analyzer.checkAccidentalJump(energyLandscape.wells);
  
  res.json({
    ...energyLandscape,
    foldingSequence,
    hasAccidentalJump
  });
});

app.post('/api/analyze/folding', (req, res) => {
  const { vertices, edges, faces, thickness, progress } = req.body;
  
  const solver = new SphericalLinkageSolver(vertices, edges, faces);
  const analyzer = new BistableEnergyAnalyzer(vertices, edges, faces, thickness);
  
  const angles = solver.computeDihedralAngles(progress);
  const energy = analyzer.computePotentialEnergy(angles);
  const interferences = solver.detectThicknessInterference(thickness);
  const deadlocks = solver.checkDeadlockConfiguration(angles);
  const overconstraints = solver.detectOverconstraints();
  
  res.json({
    progress,
    angles,
    energy,
    interferences,
    deadlocks,
    overconstraints,
    hasDeadlock: deadlocks.length > 0,
    hasInterference: interferences.length > 0,
    hasOverconstraint: overconstraints.length > 0
  });
});

app.post('/api/dihedral-sequences', (req, res) => {
  const { creasePatternId, sequenceData, isRigidFoldable, degreesOfFreedom } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO dihedral_sequences (crease_pattern_id, sequence_data, is_rigid_foldable, degrees_of_freedom)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    creasePatternId,
    JSON.stringify(sequenceData),
    isRigidFoldable ? 1 : 0,
    degreesOfFreedom
  );
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.post('/api/energy-landscapes', (req, res) => {
  const { creasePatternId, landscape, wells, barriers, isBistable } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO energy_landscapes (crease_pattern_id, potential_data, wells_data, barriers_data, is_bistable)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    creasePatternId,
    JSON.stringify(landscape),
    JSON.stringify(wells),
    JSON.stringify(barriers),
    isBistable ? 1 : 0
  );
  
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/dihedral-sequences/:creasePatternId', (req, res) => {
  const sequences = db.prepare('SELECT * FROM dihedral_sequences WHERE crease_pattern_id = ?').all(req.params.creasePatternId);
  res.json(sequences.map(s => ({
    ...s,
    sequence_data: JSON.parse(s.sequence_data)
  })));
});

app.get('/api/energy-landscapes/:creasePatternId', (req, res) => {
  const landscapes = db.prepare('SELECT * FROM energy_landscapes WHERE crease_pattern_id = ?').all(req.params.creasePatternId);
  res.json(landscapes.map(l => ({
    ...l,
    potential_data: JSON.parse(l.potential_data),
    wells_data: JSON.parse(l.wells_data),
    barriers_data: JSON.parse(l.barriers_data)
  })));
});

app.listen(PORT, () => {
  console.log(`刚性折纸分析系统后端服务器运行在端口 ${PORT}`);
});
