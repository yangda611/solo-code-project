const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const algorithms = require('./algorithms');
const db = require('./database');
const { getPreset, getAllPresets } = require('./presets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/presets', (req, res) => {
  try {
    res.json({ presets: getAllPresets() });
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

app.get('/api/presets/:id', (req, res) => {
  try {
    const preset = getPreset(req.params.id);
    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.json(preset);
  } catch (error) {
    console.error('Error fetching preset:', error);
    res.status(500).json({ error: 'Failed to fetch preset' });
  }
});

app.post('/api/analyze', (req, res) => {
  try {
    const { graph, dynamicNodes = [] } = req.body;

    if (!graph || typeof graph !== 'object') {
      return res.status(400).json({ error: 'Valid graph data is required' });
    }

    if (Object.keys(graph).length === 0) {
      return res.status(400).json({ error: 'Graph cannot be empty' });
    }

    const startTime = Date.now();
    const scc = algorithms.tarjan(graph);
    const cycles = algorithms.getCyclePaths(graph);
    const topologicalOrder = algorithms.topologicalSort(graph);
    const recommendations = algorithms.recommendBreakingEdges(graph);
    const dynamicIssues = algorithms.detectDynamicImportIssues(graph, dynamicNodes);

    const endTime = Date.now();
    const performance = {
      analysisTime: endTime - startTime,
      nodeCount: Object.keys(graph).length,
      edgeCount: Object.values(graph).reduce((sum, edges) => sum + (Array.isArray(edges) ? edges.length : 0), 0),
      sccCount: scc.length,
      cycleCount: cycles.length
    };

    res.json({
      graph,
      stronglyConnectedComponents: scc,
      cycles,
      topologicalOrder,
      recommendations,
      dynamicIssues,
      performance
    });
  } catch (error) {
    console.error('Error analyzing graph:', error);
    res.status(500).json({ error: 'Failed to analyze graph', details: error.message });
  }
});

app.post('/api/parse-pseudocode', (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Pseudocode string is required' });
    }

    const graph = algorithms.parsePseudocode(code);
    
    if (Object.keys(graph).length === 0) {
      return res.status(400).json({ error: 'No valid dependencies found in pseudocode' });
    }

    res.json({ graph });
  } catch (error) {
    console.error('Error parsing pseudocode:', error);
    res.status(400).json({ error: 'Failed to parse pseudocode', details: error.message });
  }
});

app.get('/api/snapshots', async (req, res) => {
  try {
    const snapshots = await db.getSnapshots();
    res.json({ snapshots });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    res.status(500).json({ error: 'Failed to fetch snapshots' });
  }
});

app.get('/api/snapshots/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid snapshot ID' });
    }

    const snapshot = await db.getSnapshot(id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot' });
  }
});

app.post('/api/snapshots', async (req, res) => {
  try {
    const { name, graphData } = req.body;
    if (!name || !graphData) {
      return res.status(400).json({ error: 'Name and graphData are required' });
    }

    const id = await db.saveSnapshot(name, graphData);
    res.json({ id, success: true });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ error: 'Failed to save snapshot', details: error.message });
  }
});

app.get('/api/snapshots/:id/suggestions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid snapshot ID' });
    }

    const suggestions = await db.getRefactoringSuggestions(id);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.post('/api/snapshots/:id/suggestions', async (req, res) => {
  try {
    const snapshotId = parseInt(req.params.id);
    if (isNaN(snapshotId)) {
      return res.status(400).json({ error: 'Invalid snapshot ID' });
    }

    const { cyclePath, suggestion, impactScore } = req.body;
    if (!cyclePath || !suggestion) {
      return res.status(400).json({ error: 'cyclePath and suggestion are required' });
    }

    await db.saveRefactoringSuggestion(snapshotId, cyclePath, suggestion, impactScore || 0);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving suggestion:', error);
    res.status(500).json({ error: 'Failed to save suggestion', details: error.message });
  }
});

app.post('/api/influence-range', (req, res) => {
  try {
    const { graph, startNode } = req.body;
    if (!graph || !startNode) {
      return res.status(400).json({ error: 'Graph and startNode are required' });
    }

    if (!graph[startNode]) {
      return res.status(404).json({ error: 'Start node not found in graph' });
    }

    const range = algorithms.calculateInfluenceRange(graph, startNode);
    res.json({ influenceRange: range });
  } catch (error) {
    console.error('Error calculating influence range:', error);
    res.status(500).json({ error: 'Failed to calculate influence range' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  Dependency Analyzer Backend`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Started at: ${new Date().toISOString()}`);
  console.log(`========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
