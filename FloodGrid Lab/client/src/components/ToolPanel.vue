<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentTool: {
    type: String,
    default: 'terrain'
  },
  brushSize: {
    type: Number,
    default: 2
  },
  elevationBrush: {
    type: Number,
    default: 2
  }
});

const emit = defineEmits(['update:currentTool', 'update:brushSize', 'update:elevationBrush']);

const tools = [
  { id: 'terrain', name: '升高地形', icon: '⛰️', category: 'terrain' },
  { id: 'terrainLower', name: '降低地形', icon: '🕳️', category: 'terrain' },
  { id: 'reservoir', name: '水库', icon: '💧', category: 'elements' },
  { id: 'river', name: '河道', icon: '🌊', category: 'elements' },
  { id: 'drainage', name: '排水口', icon: '🔧', category: 'elements' },
  { id: 'building', name: '建筑物', icon: '🏢', category: 'elements' },
  { id: 'road', name: '道路', icon: '🛣️', category: 'elements' },
  { id: 'eraser', name: '橡皮擦', icon: '🗑️', category: 'tools' }
];

const terrainTools = computed(() => tools.filter(t => t.category === 'terrain'));
const elementTools = computed(() => tools.filter(t => t.category === 'elements'));
const otherTools = computed(() => tools.filter(t => t.category === 'tools'));

function selectTool(toolId) {
  emit('update:currentTool', toolId);
}

function updateBrushSize(event) {
  emit('update:brushSize', parseInt(event.target.value));
}

function updateElevationBrush(event) {
  emit('update:elevationBrush', parseFloat(event.target.value));
}
</script>

<template>
  <div class="tool-panel">
    <h3 class="panel-title">工具箱</h3>
    
    <div class="tool-section">
      <h4 class="section-title">地形编辑</h4>
      <div class="tool-grid">
        <button
          v-for="tool in terrainTools"
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="['tool-btn', { active: currentTool === tool.id }]"
          :title="tool.name"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="tool-section">
      <h4 class="section-title">元素放置</h4>
      <div class="tool-grid">
        <button
          v-for="tool in elementTools"
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="['tool-btn', { active: currentTool === tool.id }]"
          :title="tool.name"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="tool-section">
      <h4 class="section-title">工具</h4>
      <div class="tool-grid">
        <button
          v-for="tool in otherTools"
          :key="tool.id"
          @click="selectTool(tool.id)"
          :class="['tool-btn', { active: currentTool === tool.id }]"
          :title="tool.name"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-label">{{ tool.name }}</span>
        </button>
      </div>
    </div>
    
    <div class="tool-settings">
      <h4 class="section-title">笔刷设置</h4>
      
      <div class="setting-item">
        <label class="setting-label">笔刷大小: {{ brushSize }}</label>
        <input
          type="range"
          min="1"
          max="5"
          :value="brushSize"
          @input="updateBrushSize"
          class="slider"
        />
      </div>
      
      <div class="setting-item">
        <label class="setting-label">高度变化: {{ elevationBrush.toFixed(1) }}</label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          :value="elevationBrush"
          @input="updateElevationBrush"
          class="slider"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-panel {
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  height: 100%;
  overflow-y: auto;
}

.panel-title {
  color: #fff;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #4a5568;
}

.tool-section {
  margin-bottom: 24px;
}

.section-title {
  color: #a0aec0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  background: #4a5568;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-btn:hover {
  background: #718096;
  transform: translateY(-2px);
}

.tool-btn.active {
  background: #4299e1;
  border-color: #63b3ed;
  box-shadow: 0 0 15px rgba(66, 153, 225, 0.4);
}

.tool-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.tool-label {
  color: #fff;
  font-size: 0.75rem;
  text-align: center;
}

.tool-settings {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #4a5568;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-label {
  display: block;
  color: #e2e8f0;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #4a5568;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  background: #63b3ed;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4299e1;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  background: #63b3ed;
  transform: scale(1.1);
}
</style>
