const express = require('express');
const router = express.Router();
const TopologyOptimizer = require('../solver/topologyOptimizer');
const db = require('../database');

let activeOptimizer = null;
let optimizationProgress = [];

router.post('/init', async (req, res) => {
  try {
    const config = req.body;
    activeOptimizer = new TopologyOptimizer(config);
    optimizationProgress = [];
    
    const result = await db.runQuery(
      `INSERT INTO projects (name, grid_size_x, grid_size_y, grid_size_z, 
        reynolds_min, reynolds_max, pressure_drop_constraint, min_feature_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [config.name || 'Untitled', config.gridSizeX || 32, config.gridSizeY || 20, 
       config.gridSizeZ || 8, config.reynoldsMin || 10, config.reynoldsMax || 1000,
       config.pressureDropConstraint || 100, config.minFeatureSize || 2]
    );
    
    res.json({ 
      success: true, 
      projectId: result.lastID,
      message: 'Optimizer initialized' 
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/boundaries', async (req, res) => {
  try {
    const { inlet, outlet, solid, projectId } = req.body;
    
    if (!activeOptimizer) {
      return res.status(400).json({ success: false, error: 'Optimizer not initialized' });
    }
    
    activeOptimizer.setBoundaries(inlet, outlet, solid);
    
    if (projectId) {
      for (const b of [...inlet, ...outlet, ...solid]) {
        await db.runQuery(
          `INSERT INTO boundary_conditions (project_id, type, position_x, position_y, 
            position_z, size_x, size_y, size_z, value)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [projectId, b.type || 'inlet', b.x, b.y, b.z, b.sx, b.sy, b.sz, b.value || 1.0]
        );
      }
    }
    
    res.json({ success: true, message: 'Boundary conditions set' });
  } catch (error) {
    console.error('Boundary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/optimize', async (req, res) => {
  try {
    const iterations = parseInt(req.query.iterations) || 20;
    const projectId = req.query.projectId || null;
    
    if (!activeOptimizer) {
      return res.status(400).json({ success: false, error: 'Optimizer not initialized' });
    }
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    await activeOptimizer.optimize(iterations, (progress) => {
      optimizationProgress.push(progress);
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });
    
    if (projectId) {
      for (const step of optimizationProgress) {
        await db.runQuery(
          `INSERT INTO density_fields (project_id, iteration, density_data, 
            objective_value, pressure_drop)
           VALUES (?, ?, ?, ?, ?)`,
          [projectId, step.iteration, JSON.stringify(step.densityField),
           step.objective, step.pressureDrop]
        );
      }
    }
    
    const finalResult = optimizationProgress[optimizationProgress.length - 1];
    res.write(`data: ${JSON.stringify({ ...finalResult, complete: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Optimization error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message, complete: true })}\n\n`);
    res.end();
  }
});

router.get('/progress', (req, res) => {
  res.json({ success: true, progress: optimizationProgress });
});

router.post('/streamlines', (req, res) => {
  try {
    const { startPoints } = req.body;
    
    if (!activeOptimizer) {
      return res.status(400).json({ success: false, error: 'Optimizer not initialized' });
    }
    
    const streamlines = activeOptimizer.getStreamlines(startPoints);
    res.json({ success: true, streamlines });
  } catch (error) {
    console.error('Streamline error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/isosurface', (req, res) => {
  try {
    const { threshold = 0.5 } = req.body;
    
    if (!activeOptimizer) {
      return res.status(400).json({ success: false, error: 'Optimizer not initialized' });
    }
    
    const isosurface = activeOptimizer.extractIsoSurface(threshold);
    res.json({ success: true, isosurface });
  } catch (error) {
    console.error('Isosurface error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const densityFields = await db.allQuery(
      `SELECT * FROM density_fields WHERE project_id = ? ORDER BY iteration`,
      [projectId]
    );
    
    const boundaries = await db.allQuery(
      `SELECT * FROM boundary_conditions WHERE project_id = ?`,
      [projectId]
    );
    
    res.json({ success: true, densityFields, boundaries });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
