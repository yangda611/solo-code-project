const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'database', 'urbanflow.db');
const db = new sqlite3.Database(dbPath);

// 路口 API
const intersectionsRouter = require('./routes/intersections')(db);
app.use('/api/intersections', intersectionsRouter);

// 道路 API
const roadsRouter = require('./routes/roads')(db);
app.use('/api/roads', roadsRouter);

// 红绿灯 API
const trafficLightsRouter = require('./routes/trafficLights')(db);
app.use('/api/traffic-lights', trafficLightsRouter);

// 车辆生成点 API
const spawnPointsRouter = require('./routes/spawnPoints')(db);
app.use('/api/spawn-points', spawnPointsRouter);

// 仿真统计 API
const simulationRouter = require('./routes/simulation')(db);
app.use('/api/simulation', simulationRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UrbanFlow Simulator API is running' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
