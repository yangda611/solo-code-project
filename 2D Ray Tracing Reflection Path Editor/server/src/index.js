const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { traceLightSource, detectClosedLoop } = require('./ray-tracing');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

app.post('/api/scenes', (req, res) => {
  const { name } = req.body;
  const id = db.createScene(name || 'Untitled Scene');
  res.json({ id, name });
});

app.get('/api/scenes', (req, res) => {
  res.json(db.getScenes());
});

app.delete('/api/scenes/:id', (req, res) => {
  db.deleteScene(req.params.id);
  res.json({ success: true });
});

app.post('/api/scenes/:id/obstacles', (req, res) => {
  const id = db.addObstacle(req.params.id, req.body);
  res.json({ id, ...req.body });
});

app.get('/api/scenes/:id/obstacles', (req, res) => {
  res.json(db.getObstacles(req.params.id));
});

app.delete('/api/obstacles/:id', (req, res) => {
  db.deleteObstacle(req.params.id);
  res.json({ success: true });
});

app.post('/api/scenes/:id/lights', (req, res) => {
  const id = db.addLight(req.params.id, req.body);
  res.json({ id, ...req.body });
});

app.get('/api/scenes/:id/lights', (req, res) => {
  res.json(db.getLights(req.params.id));
});

app.delete('/api/lights/:id', (req, res) => {
  db.deleteLight(req.params.id);
  res.json({ success: true });
});

app.get('/api/presets', (req, res) => {
  res.json(db.getPresets());
});

app.get('/api/presets/:index', (req, res) => {
  const preset = db.loadPreset(parseInt(req.params.index));
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json(preset);
});

app.post('/api/trace', (req, res) => {
  const { lights, obstacles, maxBounces = 10 } = req.body;
  const startTime = Date.now();
  let allPaths = [];
  for (const light of lights) {
    const paths = traceLightSource(light, obstacles, maxBounces);
    allPaths = allPaths.concat(paths);
  }
  const loops = detectClosedLoop(allPaths);
  const computeTime = Date.now() - startTime;
  const escapedPaths = allPaths.filter(p => p.type === 'escape');
  const absorbedPaths = allPaths.filter(p => p.type === 'absorb');
  const maxDepth = allPaths.reduce((max, p) => Math.max(max, p.depth || 0), 0);
  res.json({
    paths: allPaths,
    loops,
    stats: {
      totalPaths: allPaths.length,
      escapedPaths: escapedPaths.length,
      absorbedPaths: absorbedPaths.length,
      maxDepth,
      computeTime,
      hasPerformanceIssue: computeTime > 100 || maxDepth > 20
    }
  });
});

app.listen(PORT, () => {
  console.log(`Ray Tracing Server running on http://localhost:${PORT}`);
});
