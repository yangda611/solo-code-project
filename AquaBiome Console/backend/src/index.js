const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./database/schema');
const { seedPresets } = require('./database/seed');

const presetsRouter = require('./routes/presets');
const fishRouter = require('./routes/fish');
const coralsRouter = require('./routes/corals');
const devicesRouter = require('./routes/devices');
const waterRouter = require('./routes/water');
const lightingRouter = require('./routes/lighting');
const feedingRouter = require('./routes/feeding');
const alertsRouter = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/presets', presetsRouter);
app.use('/api/fish', fishRouter);
app.use('/api/corals', coralsRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/water', waterRouter);
app.use('/api/lighting', lightingRouter);
app.use('/api/feeding', feedingRouter);
app.use('/api/alerts', alertsRouter);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

async function startServer() {
  try {
    initDatabase();
    seedPresets();
    console.log('Database initialized and seeded successfully');
    
    app.listen(PORT, () => {
      console.log(`AquaBiome Backend Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
