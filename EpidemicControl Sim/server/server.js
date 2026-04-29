const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const SimulationEngine = require('./simulation/SimulationEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const simulationEngine = new SimulationEngine();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start-simulation', (params) => {
    simulationEngine.start(params, (state) => {
      socket.emit('simulation-update', state);
    });
  });

  socket.on('pause-simulation', () => {
    simulationEngine.pause();
  });

  socket.on('resume-simulation', () => {
    simulationEngine.resume();
  });

  socket.on('stop-simulation', () => {
    simulationEngine.stop();
  });

  socket.on('update-params', (params) => {
    simulationEngine.updateParams(params);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    simulationEngine.stop();
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
