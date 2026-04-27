<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  parameters: {
    type: Object,
    default: () => ({
      rainfallIntensity: 0,
      reservoirWaterLevel: 0,
      spillwaySize: 0,
      drainageCapacity: 0
    })
  },
  isSimulating: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:parameters', 'startSimulation', 'stopSimulation', 'resetSimulation']);

const localParams = ref({ ...props.parameters });

watch(() => props.parameters, (newParams) => {
  localParams.value = { ...newParams };
}, { deep: true });

function updateParam(key, value) {
  localParams.value[key] = parseFloat(value);
  emit('update:parameters', { ...localParams.value });
}

function handleStart() {
  emit('startSimulation');
}

function handleStop() {
  emit('stopSimulation');
}

function handleReset() {
  emit('resetSimulation');
}
</script>

<template>
  <div class="parameter-panel">
    <h3 class="panel-title">模拟参数</h3>
    
    <div class="parameter-section">
      <h4 class="section-title">🌧️ 降雨设置</h4>
      <div class="parameter-item">
        <label class="parameter-label">
          降雨强度
          <span class="parameter-value">{{ parameters.rainfallIntensity }} mm/h</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          :value="parameters.rainfallIntensity"
          @input="updateParam('rainfallIntensity', $event.target.value)"
          :disabled="isSimulating"
          class="slider"
        />
        <div class="slider-labels">
          <span>无雨</span>
          <span>小雨</span>
          <span>中雨</span>
          <span>大雨</span>
          <span>暴雨</span>
        </div>
      </div>
    </div>
    
    <div class="parameter-section">
      <h4 class="section-title">💧 水库设置</h4>
      <div class="parameter-item">
        <label class="parameter-label">
          水库水位
          <span class="parameter-value">{{ parameters.reservoirWaterLevel }} m</span>
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="0.5"
          :value="parameters.reservoirWaterLevel"
          @input="updateParam('reservoirWaterLevel', $event.target.value)"
          :disabled="isSimulating"
          class="slider"
        />
        <div class="slider-labels">
          <span>0m</span>
          <span>5m</span>
          <span>10m</span>
          <span>15m</span>
          <span>20m</span>
        </div>
      </div>
      
      <div class="parameter-item">
        <label class="parameter-label">
          泄洪口大小
          <span class="parameter-value">{{ parameters.spillwaySize }} m²</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          :value="parameters.spillwaySize"
          @input="updateParam('spillwaySize', $event.target.value)"
          :disabled="isSimulating"
          class="slider"
        />
        <div class="slider-labels">
          <span>关闭</span>
          <span>小</span>
          <span>中</span>
          <span>大</span>
          <span>全开</span>
        </div>
      </div>
    </div>
    
    <div class="parameter-section">
      <h4 class="section-title">🔧 排水系统</h4>
      <div class="parameter-item">
        <label class="parameter-label">
          排水管道容量
          <span class="parameter-value">{{ parameters.drainageCapacity }} m³/s</span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          :value="parameters.drainageCapacity"
          @input="updateParam('drainageCapacity', $event.target.value)"
          :disabled="isSimulating"
          class="slider"
        />
        <div class="slider-labels">
          <span>无</span>
          <span>低</span>
          <span>中</span>
          <span>高</span>
          <span>极高</span>
        </div>
      </div>
    </div>
    
    <div class="control-section">
      <h4 class="section-title">🎮 模拟控制</h4>
      <div class="control-buttons">
        <button
          v-if="!isSimulating"
          @click="handleStart"
          class="control-btn start-btn"
        >
          <span class="btn-icon">▶️</span>
          开始模拟
        </button>
        <button
          v-else
          @click="handleStop"
          class="control-btn stop-btn"
        >
          <span class="btn-icon">⏸️</span>
          暂停模拟
        </button>
        <button
          @click="handleReset"
          class="control-btn reset-btn"
        >
          <span class="btn-icon">🔄</span>
          重置
        </button>
      </div>
    </div>
    
    <div class="legend-section">
      <h4 class="section-title">📊 图例</h4>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color shallow-water"></div>
          <span class="legend-label">浅水 (0-1m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color medium-water"></div>
          <span class="legend-label">中水 (1-2m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color danger-water"></div>
          <span class="legend-label">危险 (>2m)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parameter-panel {
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

.parameter-section,
.control-section,
.legend-section {
  margin-bottom: 24px;
}

.section-title {
  color: #a0aec0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.parameter-item {
  margin-bottom: 20px;
}

.parameter-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #e2e8f0;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.parameter-value {
  background: #4a5568;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  color: #63b3ed;
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

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.65rem;
  color: #718096;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon {
  font-size: 1.1rem;
}

.start-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
}

.stop-btn {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(237, 137, 54, 0.3);
}

.stop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(237, 137, 54, 0.4);
}

.reset-btn {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(113, 128, 150, 0.3);
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(113, 128, 150, 0.4);
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.shallow-water {
  background: rgba(30, 80, 180, 0.5);
}

.medium-water {
  background: rgba(180, 160, 120, 0.6);
}

.danger-water {
  background: rgba(220, 80, 50, 0.7);
}

.legend-label {
  color: #e2e8f0;
  font-size: 0.85rem;
}
</style>
