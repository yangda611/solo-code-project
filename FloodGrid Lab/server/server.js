const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let simulationState = {
  isRunning: false,
  timeStep: 0,
  terrain: null,
  waterLevel: [],
  elements: [],
  parameters: {
    rainfallIntensity: 0,
    reservoirWaterLevel: 0,
    spillwaySize: 0,
    drainageCapacity: 0
  }
};

const GRID_SIZE = 50;

function initializeGrid(size) {
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push({
        elevation: Math.random() * 2,
        type: 'ground',
        waterLevel: 0,
        flowDirection: 0
      });
    }
    grid.push(row);
  }
  return grid;
}

function initializeWaterLevel(size) {
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push(0);
    }
    grid.push(row);
  }
  return grid;
}

simulationState.terrain = initializeGrid(GRID_SIZE);
simulationState.waterLevel = initializeWaterLevel(GRID_SIZE);

function simulateWaterFlow() {
  if (!simulationState.isRunning) return;

  const { terrain, waterLevel, parameters, elements } = simulationState;
  const newWaterLevel = JSON.parse(JSON.stringify(waterLevel));
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      newWaterLevel[y][x] += parameters.rainfallIntensity * 0.001;
    }
  }

  const reservoirs = elements.filter(e => e.type === 'reservoir');
  reservoirs.forEach(reservoir => {
    const releaseAmount = parameters.reservoirWaterLevel * parameters.spillwaySize * 0.0001;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = reservoir.x + dx;
        const ny = reservoir.y + dy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          newWaterLevel[ny][nx] += releaseAmount / 9;
        }
      }
    }
  });

  const drainages = elements.filter(e => e.type === 'drainage');
  drainages.forEach(drainage => {
    const drainAmount = Math.min(
      newWaterLevel[drainage.y][drainage.x],
      parameters.drainageCapacity * 0.001
    );
    newWaterLevel[drainage.y][drainage.x] -= drainAmount;
  });

  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    const tempWaterLevel = JSON.parse(JSON.stringify(newWaterLevel));
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const currentTotal = terrain[y][x].elevation + newWaterLevel[y][x];
        const neighbors = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: -1 },
          { dx: 1, dy: -1 },
          { dx: -1, dy: 1 },
          { dx: 1, dy: 1 }
        ];

        let flowOut = 0;
        const flowRates = [];

        neighbors.forEach(n => {
          const nx = x + n.dx;
          const ny = y + n.dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const neighborTotal = terrain[ny][nx].elevation + newWaterLevel[ny][nx];
            const heightDiff = currentTotal - neighborTotal;
            
            if (heightDiff > 0.01) {
              const flowRate = heightDiff * 0.05;
              flowRates.push({ nx, ny, flowRate });
              flowOut += flowRate;
            }
          }
        });

        if (flowOut > 0) {
          const maxFlow = newWaterLevel[y][x] * 0.3;
          const scale = Math.min(1, maxFlow / flowOut);
          
          flowRates.forEach(({ nx, ny, flowRate }) => {
            const actualFlow = flowRate * scale;
            tempWaterLevel[y][x] -= actualFlow;
            tempWaterLevel[ny][nx] += actualFlow;
          });
        }
      }
    }
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        newWaterLevel[y][x] = Math.max(0, tempWaterLevel[y][x]);
      }
    }
  }

  simulationState.waterLevel = newWaterLevel;
  simulationState.timeStep++;
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.send(JSON.stringify({
    type: 'init',
    data: simulationState
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'updateTerrain':
          simulationState.terrain = data.terrain;
          broadcast({
            type: 'terrainUpdate',
            data: simulationState.terrain
          });
          break;

        case 'updateElements':
          simulationState.elements = data.elements;
          broadcast({
            type: 'elementsUpdate',
            data: simulationState.elements
          });
          break;

        case 'updateParameters':
          simulationState.parameters = { ...simulationState.parameters, ...data.parameters };
          broadcast({
            type: 'parametersUpdate',
            data: simulationState.parameters
          });
          break;

        case 'startSimulation':
          simulationState.isRunning = true;
          broadcast({
            type: 'simulationStarted'
          });
          break;

        case 'stopSimulation':
          simulationState.isRunning = false;
          broadcast({
            type: 'simulationStopped'
          });
          break;

        case 'resetSimulation':
          simulationState.isRunning = false;
          simulationState.timeStep = 0;
          simulationState.waterLevel = initializeWaterLevel(GRID_SIZE);
          broadcast({
            type: 'simulationReset',
            data: {
              waterLevel: simulationState.waterLevel,
              timeStep: 0
            }
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

setInterval(() => {
  if (simulationState.isRunning) {
    simulateWaterFlow();
    broadcast({
      type: 'simulationUpdate',
      data: {
        waterLevel: simulationState.waterLevel,
        timeStep: simulationState.timeStep
      }
    });
  }
}, 100);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务器运行在 ws://localhost:${PORT}`);
});
