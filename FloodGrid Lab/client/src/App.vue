<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ParameterPanel from './components/ParameterPanel.vue';
import SimulationCanvas from './components/SimulationCanvas.vue';
import ToolPanel from './components/ToolPanel.vue';

const GRID_SIZE = 50;

let ws = null;
const isConnected = ref(false);

const terrain = ref([]);
const waterLevel = ref([]);
const elements = ref([]);
const isSimulating = ref(false);
const currentTool = ref('terrain');
const brushSize = ref(2);
const elevationBrush = ref(2);

const parameters = ref({
  rainfallIntensity: 0,
  reservoirWaterLevel: 0,
  spillwaySize: 0,
  drainageCapacity: 0
});

function initializeGrid(size) {
  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push({
        elevation: Math.random() * 2,
        type: 'ground'
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

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const wsUrl = `${protocol}//${host}:3000`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket 连接成功');
    isConnected.value = true;
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
  };
  
  ws.onclose = () => {
    console.log('WebSocket 连接关闭');
    isConnected.value = false;
    setTimeout(connectWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
  };
}

function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'init':
      if (message.data.terrain) {
        terrain.value = message.data.terrain;
      }
      if (message.data.waterLevel) {
        waterLevel.value = message.data.waterLevel;
      }
      if (message.data.elements) {
        elements.value = message.data.elements;
      }
      if (message.data.parameters) {
        parameters.value = message.data.parameters;
      }
      break;
      
    case 'terrainUpdate':
      terrain.value = message.data;
      break;
      
    case 'elementsUpdate':
      elements.value = message.data;
      break;
      
    case 'parametersUpdate':
      parameters.value = message.data;
      break;
      
    case 'simulationUpdate':
      if (message.data.waterLevel) {
        waterLevel.value = message.data.waterLevel;
      }
      break;
      
    case 'simulationStarted':
      isSimulating.value = true;
      break;
      
    case 'simulationStopped':
      isSimulating.value = false;
      break;
      
    case 'simulationReset':
      isSimulating.value = false;
      if (message.data.waterLevel) {
        waterLevel.value = message.data.waterLevel;
      }
      break;
  }
}

function sendMessage(type, data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...data }));
  }
}

function handleTerrainUpdate(newTerrain) {
  terrain.value = newTerrain;
  sendMessage('updateTerrain', { terrain: newTerrain });
}

function handleElementsUpdate(newElements) {
  elements.value = newElements;
  sendMessage('updateElements', { elements: newElements });
}

function handleUpdateParameters(newParams) {
  parameters.value = newParams;
  sendMessage('updateParameters', { parameters: newParams });
}

function handleStartSimulation() {
  sendMessage('startSimulation', {});
}

function handleStopSimulation() {
  sendMessage('stopSimulation', {});
}

function handleResetSimulation() {
  sendMessage('resetSimulation', {});
}

function handleUpdateCurrentTool(tool) {
  currentTool.value = tool;
}

function handleUpdateBrushSize(size) {
  brushSize.value = size;
}

function handleUpdateElevationBrush(elevation) {
  elevationBrush.value = elevation;
}

onMounted(() => {
  terrain.value = initializeGrid(GRID_SIZE);
  waterLevel.value = initializeWaterLevel(GRID_SIZE);
  connectWebSocket();
});

onUnmounted(() => {
  if (ws) {
    ws.close();
  }
});
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">🌊 水库泄洪与城市内涝模拟系统</h1>
      <div class="connection-status" :class="{ connected: isConnected }">
        <span class="status-dot"></span>
        <span>{{ isConnected ? '已连接' : '连接中...' }}</span>
      </div>
    </header>
    
    <main class="main-content">
      <aside class="sidebar left-sidebar">
        <ToolPanel
          :current-tool="currentTool"
          :brush-size="brushSize"
          :elevation-brush="elevationBrush"
          @update:current-tool="handleUpdateCurrentTool"
          @update:brush-size="handleUpdateBrushSize"
          @update:elevation-brush="handleUpdateElevationBrush"
        />
      </aside>
      
      <section class="canvas-section">
        <SimulationCanvas
          :terrain="terrain"
          :water-level="waterLevel"
          :elements="elements"
          :is-simulating="isSimulating"
          :current-tool="currentTool"
          :elevation-brush="elevationBrush"
          :brush-size="brushSize"
          :parameters="parameters"
          @terrain-update="handleTerrainUpdate"
          @elements-update="handleElementsUpdate"
        />
      </section>
      
      <aside class="sidebar right-sidebar">
        <ParameterPanel
          :parameters="parameters"
          :is-simulating="isSimulating"
          @update:parameters="handleUpdateParameters"
          @start-simulation="handleStartSimulation"
          @stop-simulation="handleStopSimulation"
          @reset-simulation="handleResetSimulation"
        />
      </aside>
    </main>
    
    <footer class="app-footer">
      <div class="simulation-info">
        <span v-if="isSimulating" class="simulation-running">
          ⏱️ 模拟运行中...
        </span>
        <span v-else class="simulation-stopped">
          ⏸️ 模拟已暂停
        </span>
      </div>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100vw;
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app-title {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #a0aec0;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.connection-status.connected {
  background: rgba(72, 187, 120, 0.2);
  color: #68d391;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #718096;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-dot {
  background: #68d391;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.main-content {
  display: flex;
  flex: 1;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
}

.canvas-section {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.app-footer {
  padding: 10px 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.simulation-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.simulation-running {
  color: #68d391;
  font-size: 0.9rem;
  animation: blink 1s infinite;
}

.simulation-stopped {
  color: #a0aec0;
  font-size: 0.9rem;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>