<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

const props = defineProps({
  terrain: {
    type: Array,
    required: true
  },
  waterLevel: {
    type: Array,
    required: true
  },
  elements: {
    type: Array,
    required: true
  },
  isSimulating: {
    type: Boolean,
    default: false
  },
  currentTool: {
    type: String,
    default: 'terrain'
  },
  elevationBrush: {
    type: Number,
    default: 2
  },
  brushSize: {
    type: Number,
    default: 2
  },
  parameters: {
    type: Object,
    default: () => ({
      rainfallIntensity: 0,
      reservoirWaterLevel: 0,
      spillwaySize: 0,
      drainageCapacity: 0
    })
  }
});

const emit = defineEmits(['terrainUpdate', 'elementsUpdate']);

const canvasRef = ref(null);
const containerRef = ref(null);
let ctx = null;
let animationId = null;
let canvasWidth = 800;
let canvasHeight = 600;
const GRID_SIZE = 50;

const isDrawing = ref(false);
let lastTime = 0;

let raindrops = [];
const maxRaindrops = 200;

let waterRipples = [];
let flowArrows = [];

let dangerZones = {
  current: [],
  previous: []
};

const cellSize = computed(() => {
  return Math.min(
    (canvasWidth - 40) / GRID_SIZE,
    (canvasHeight - 40) / GRID_SIZE
  );
});

const offsetX = computed(() => {
  return (canvasWidth - GRID_SIZE * cellSize.value) / 2;
});

const offsetY = computed(() => {
  return (canvasHeight - GRID_SIZE * cellSize.value) / 2;
});

function elevationToColor(elevation) {
  const normalized = Math.max(0, Math.min(1, elevation / 10));
  if (normalized < 0.2) {
    return `rgb(${Math.floor(64 + normalized * 100)}, ${Math.floor(128 + normalized * 100)}, ${Math.floor(64 + normalized * 50)})`;
  } else if (normalized < 0.4) {
    return `rgb(${Math.floor(100 + (normalized - 0.2) * 100)}, ${Math.floor(160 + (normalized - 0.2) * 50)}, ${Math.floor(80 + (normalized - 0.2) * 50)})`;
  } else if (normalized < 0.6) {
    return `rgb(${Math.floor(150 + (normalized - 0.4) * 100)}, ${Math.floor(180 + (normalized - 0.4) * 40)}, ${Math.floor(100 + (normalized - 0.4) * 50)})`;
  } else if (normalized < 0.8) {
    return `rgb(${Math.floor(200 + (normalized - 0.6) * 50)}, ${Math.floor(200 + (normalized - 0.6) * 30)}, ${Math.floor(130 + (normalized - 0.6) * 50)})`;
  } else {
    return `rgb(${Math.floor(230 + (normalized - 0.8) * 25)}, ${Math.floor(220 + (normalized - 0.8) * 35)}, ${Math.floor(180 + (normalized - 0.8) * 50)})`;
  }
}

function waterToColor(waterLevel, elevation, time) {
  const maxWater = 5;
  const depth = Math.max(0, Math.min(maxWater, waterLevel));
  const normalized = depth / maxWater;
  
  if (normalized <= 0.01) return null;
  
  let riskLevel = 0;
  if (waterLevel > 2) riskLevel = 2;
  else if (waterLevel > 1) riskLevel = 1;
  
  const baseR = 30;
  const baseG = 80;
  const baseB = 180;
  
  const waveOffset = Math.sin(time * 2 + elevation) * 0.05;
  const adjustedNormalized = Math.min(1, normalized + waveOffset);
  
  if (riskLevel === 2) {
    const pulse = Math.sin(time * 3) * 0.2 + 0.8;
    const r = Math.min(255, baseR + adjustedNormalized * 200);
    const g = Math.min(150, baseG + adjustedNormalized * 50);
    const b = Math.min(100, baseB - adjustedNormalized * 80);
    return `rgba(${Math.floor(r * pulse)}, ${Math.floor(g * pulse)}, ${Math.floor(b * pulse)}, ${0.3 + adjustedNormalized * 0.5})`;
  } else if (riskLevel === 1) {
    const r = Math.min(200, baseR + adjustedNormalized * 150);
    const g = Math.min(180, baseG + adjustedNormalized * 80);
    const b = Math.min(150, baseB - adjustedNormalized * 30);
    return `rgba(${r}, ${g}, ${b}, ${0.25 + adjustedNormalized * 0.4})`;
  } else {
    return `rgba(${baseR}, ${baseG + adjustedNormalized * 40}, ${baseB}, ${0.2 + adjustedNormalized * 0.3})`;
  }
}

function getElementColor(element) {
  const colors = {
    reservoir: '#4A90D9',
    river: '#6BB3E0',
    drainage: '#2ECC71',
    building: '#7F8C8D',
    road: '#95A5A6'
  };
  return colors[element.type] || '#333';
}

function createRaindrop() {
  const startX = Math.random() * canvasWidth;
  const startY = -10;
  const speed = 8 + Math.random() * 6;
  const length = 15 + Math.random() * 10;
  const opacity = 0.3 + Math.random() * 0.4;
  
  return {
    x: startX,
    y: startY,
    speed,
    length,
    opacity
  };
}

function updateRaindrops() {
  if (props.isSimulating && props.parameters?.rainfallIntensity > 10) {
    const intensity = props.parameters.rainfallIntensity / 100;
    const dropCount = Math.floor(intensity * 10);
    
    for (let i = 0; i < dropCount && raindrops.length < maxRaindrops; i++) {
      raindrops.push(createRaindrop());
    }
  }
  
  for (let i = raindrops.length - 1; i >= 0; i--) {
    const drop = raindrops[i];
    drop.y += drop.speed;
    
    if (drop.y > canvasHeight + 20) {
      raindrops.splice(i, 1);
    }
  }
}

function drawRaindrops() {
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)';
  ctx.lineWidth = 1;
  
  raindrops.forEach(drop => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - 1, drop.y + drop.length);
    ctx.stroke();
  });
}

function createWaterRipple(x, y) {
  return {
    x,
    y,
    radius: 0,
    maxRadius: cellSize.value * 0.8,
    opacity: 0.8,
    speed: 1 + Math.random() * 0.5
  };
}

function updateWaterRipples(time) {
  if (props.isSimulating && props.waterLevel.length > 0) {
    const surfaceCells = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (props.waterLevel[y] && props.waterLevel[y][x] > 0.1) {
          surfaceCells.push({ x, y });
        }
      }
    }
    
    if (surfaceCells.length > 0 && Math.random() < 0.02) {
      const cell = surfaceCells[Math.floor(Math.random() * surfaceCells.length)];
      const cellX = offsetX.value + cell.x * cellSize.value + cellSize.value / 2;
      const cellY = offsetY.value + cell.y * cellSize.value + cellSize.value / 2;
      waterRipples.push(createWaterRipple(cellX, cellY));
    }
  }
  
  for (let i = waterRipples.length - 1; i >= 0; i--) {
    const ripple = waterRipples[i];
    ripple.radius += ripple.speed;
    ripple.opacity = 0.8 * (1 - ripple.radius / ripple.maxRadius);
    
    if (ripple.radius >= ripple.maxRadius) {
      waterRipples.splice(i, 1);
    }
  }
}

function drawWaterRipples() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  
  waterRipples.forEach(ripple => {
    ctx.globalAlpha = ripple.opacity;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

function updateFlowArrows() {
  if (!props.isSimulating) {
    flowArrows = [];
    return;
  }
  
  if (Math.random() < 0.05) {
    const cellsWithFlow = [];
    
    for (let y = 1; y < GRID_SIZE - 1; y++) {
      for (let x = 1; x < GRID_SIZE - 1; x++) {
        if (props.waterLevel[y] && props.waterLevel[y][x] > 0.5) {
          cellsWithFlow.push({ x, y });
        }
      }
    }
    
    if (cellsWithFlow.length > 0) {
      const cell = cellsWithFlow[Math.floor(Math.random() * cellsWithFlow.length)];
      const cellX = offsetX.value + cell.x * cellSize.value + cellSize.value / 2;
      const cellY = offsetY.value + cell.y * cellSize.value + cellSize.value / 2;
      
      let dx = 0, dy = 0;
      const currentLevel = props.waterLevel[cell.y][cell.x];
      
      const neighbors = [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 }
      ];
      
      neighbors.forEach(n => {
        const nx = cell.x + n.dx;
        const ny = cell.y + n.dy;
        if (props.waterLevel[ny] && props.waterLevel[ny][nx] < currentLevel) {
          dx += n.dx;
          dy += n.dy;
        }
      });
      
      if (dx !== 0 || dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        flowArrows.push({
          x: cellX,
          y: cellY,
          dx: dx / length,
          dy: dy / length,
          opacity: 0.7,
          life: 60
        });
      }
    }
  }
  
  for (let i = flowArrows.length - 1; i >= 0; i--) {
    const arrow = flowArrows[i];
    arrow.life--;
    arrow.opacity = arrow.life / 60 * 0.7;
    
    if (arrow.life <= 0) {
      flowArrows.splice(i, 1);
    }
  }
}

function drawFlowArrows() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  
  const arrowLength = cellSize.value * 0.4;
  const headLength = 8;
  const headAngle = Math.PI / 6;
  
  flowArrows.forEach(arrow => {
    ctx.globalAlpha = arrow.opacity;
    
    const endX = arrow.x + arrow.dx * arrowLength;
    const endY = arrow.y + arrow.dy * arrowLength;
    
    ctx.beginPath();
    ctx.moveTo(arrow.x, arrow.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    const angle = Math.atan2(arrow.dy, arrow.dx);
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - headAngle),
      endY - headLength * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + headAngle),
      endY - headLength * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updateDangerZones(time) {
  dangerZones.previous = [...dangerZones.current];
  dangerZones.current = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (props.waterLevel[y] && props.waterLevel[y][x] > 2) {
        const cellX = offsetX.value + x * cellSize.value;
        const cellY = offsetY.value + y * cellSize.value;
        dangerZones.current.push({ x: cellX, y: cellY, gridX: x, gridY: y });
      }
    }
  }
}

function drawDangerZones(time) {
  const pulse = Math.sin(time * 4) * 0.3 + 0.7;
  
  dangerZones.current.forEach(zone => {
    const gradient = ctx.createRadialGradient(
      zone.x + cellSize.value / 2,
      zone.y + cellSize.value / 2,
      0,
      zone.x + cellSize.value / 2,
      zone.y + cellSize.value / 2,
      cellSize.value
    );
    
    gradient.addColorStop(0, `rgba(255, 50, 50, ${0.6 * pulse})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 50, ${0.4 * pulse})`);
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(zone.x, zone.y, cellSize.value, cellSize.value);
  });
}

function drawRoadSubmersion(time) {
  const roads = props.elements.filter(e => e.type === 'road');
  
  roads.forEach(road => {
    if (props.waterLevel[road.y] && props.waterLevel[road.y][road.x] > 0.01) {
      const cellX = offsetX.value + road.x * cellSize.value;
      const cellY = offsetY.value + road.y * cellSize.value;
      const waterDepth = props.waterLevel[road.y][road.x];
      
      if (waterDepth > 0.5) {
        const waveOffset = Math.sin(time * 2 + road.x + road.y) * 0.1;
        const coverage = Math.min(1, waterDepth / 2 + waveOffset);
        
        ctx.fillStyle = `rgba(100, 150, 200, ${0.3 * coverage})`;
        ctx.fillRect(
          cellX + 2,
          cellY + cellSize.value * (1 - coverage) + 2,
          cellSize.value - 4,
          cellSize.value * coverage - 4
        );
        
        if (waterDepth > 1) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * coverage})`;
          ctx.lineWidth = 1;
          const waveY = cellY + cellSize.value * (1 - coverage * 0.5);
          ctx.beginPath();
          ctx.moveTo(cellX + 2, waveY);
          for (let i = 0; i < cellSize.value - 4; i += 5) {
            ctx.lineTo(
              cellX + 2 + i,
              waveY + Math.sin(time * 3 + i * 0.2) * 2
            );
          }
          ctx.stroke();
        }
      }
    }
  });
}

function drawGrid(time) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cellX = offsetX.value + x * cellSize.value;
      const cellY = offsetY.value + y * cellSize.value;
      
      if (props.terrain[y] && props.terrain[y][x]) {
        const elevation = props.terrain[y][x].elevation || 0;
        ctx.fillStyle = elevationToColor(elevation);
        ctx.fillRect(cellX, cellY, cellSize.value, cellSize.value);
        
        if (props.waterLevel[y] && props.waterLevel[y][x] !== undefined) {
          const waterColor = waterToColor(props.waterLevel[y][x], elevation, time);
          if (waterColor) {
            ctx.fillStyle = waterColor;
            ctx.fillRect(cellX, cellY, cellSize.value, cellSize.value);
            
            if (props.waterLevel[y][x] > 0.5) {
              const shimmer = Math.sin(time * 4 + x * 0.5 + y * 0.3) * 0.2 + 0.8;
              ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * shimmer})`;
              ctx.fillRect(cellX, cellY, cellSize.value, cellSize.value);
            }
          }
        }
      }
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cellX, cellY, cellSize.value, cellSize.value);
    }
  }
  
  drawRoadSubmersion(time);
  
  props.elements.forEach(element => {
    const cellX = offsetX.value + element.x * cellSize.value;
    const cellY = offsetY.value + element.y * cellSize.value;
    
    ctx.fillStyle = getElementColor(element);
    ctx.globalAlpha = 0.8;
    ctx.fillRect(
      cellX + 2,
      cellY + 2,
      cellSize.value - 4,
      cellSize.value - 4
    );
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#fff';
    ctx.font = `${cellSize.value * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const symbols = {
      reservoir: '💧',
      river: '🌊',
      drainage: '🔧',
      building: '🏢',
      road: '🛣️'
    };
    ctx.fillText(
      symbols[element.type] || '?',
      cellX + cellSize.value / 2,
      cellY + cellSize.value / 2
    );
  });
  
  drawWaterRipples();
  drawFlowArrows();
  drawDangerZones(time);
  drawRaindrops();
}

function getGridCoordinates(event) {
  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  
  const gridX = Math.floor((mouseX - offsetX.value) / cellSize.value);
  const gridY = Math.floor((mouseY - offsetY.value) / cellSize.value);
  
  if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
    return { x: gridX, y: gridY };
  }
  return null;
}

function handleMouseDown(event) {
  if (props.isSimulating) return;
  isDrawing.value = true;
  handleCanvasClick(event);
}

function handleMouseMove(event) {
  if (!isDrawing.value || props.isSimulating) return;
  handleCanvasClick(event);
}

function handleMouseUp() {
  isDrawing.value = false;
}

function handleCanvasClick(event) {
  const coords = getGridCoordinates(event);
  if (!coords) return;
  
  const { x, y } = coords;
  const newTerrain = JSON.parse(JSON.stringify(props.terrain));
  const newElements = [...props.elements];
  
  const radius = props.brushSize;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          const factor = 1 - (dist / (radius + 1)) * 0.5;
          
          switch (props.currentTool) {
            case 'terrain':
              newTerrain[ny][nx].elevation = Math.max(0, 
                (newTerrain[ny][nx].elevation || 0) + props.elevationBrush * factor
              );
              break;
            case 'terrainLower':
              newTerrain[ny][nx].elevation = Math.max(0, 
                (newTerrain[ny][nx].elevation || 0) - props.elevationBrush * factor
              );
              break;
          }
        }
      }
    }
  }
  
  if (['reservoir', 'river', 'drainage', 'building', 'road'].includes(props.currentTool)) {
    const existingIndex = newElements.findIndex(e => e.x === x && e.y === y);
    if (existingIndex === -1) {
      newElements.push({
        type: props.currentTool,
        x,
        y,
        id: Date.now() + Math.random()
      });
    }
  }
  
  if (props.currentTool === 'eraser') {
    const index = newElements.findIndex(e => e.x === x && e.y === y);
    if (index !== -1) {
      newElements.splice(index, 1);
    }
  }
  
  emit('terrainUpdate', newTerrain);
  emit('elementsUpdate', newElements);
}

function animate(currentTime) {
  const time = currentTime * 0.001;
  
  updateRaindrops();
  updateWaterRipples(time);
  updateFlowArrows();
  updateDangerZones(time);
  
  drawGrid(time);
  
  animationId = requestAnimationFrame(animate);
}

function resizeCanvas() {
  if (containerRef.value) {
    canvasWidth = containerRef.value.clientWidth;
    canvasHeight = containerRef.value.clientHeight;
    if (canvasRef.value) {
      canvasRef.value.width = canvasWidth;
      canvasRef.value.height = canvasHeight;
    }
  }
}

onMounted(() => {
  ctx = canvasRef.value.getContext('2d');
  resizeCanvas();
  animationId = requestAnimationFrame(animate);
  
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', resizeCanvas);
});

watch([() => props.terrain, () => props.waterLevel, () => props.elements], () => {
}, { deep: true });
</script>

<template>
  <div ref="containerRef" class="canvas-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      class="simulation-canvas"
    ></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.simulation-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>