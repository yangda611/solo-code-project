<template>
  <div class="control-panel">
    <h2>⚙️ 模拟参数</h2>
    
    <div 
      :class="['connection-status', isConnected ? 'connected' : 'disconnected']"
    >
      <div :class="['status-dot', isConnected ? 'connected' : 'disconnected']"></div>
      <span>{{ isConnected ? '已连接' : '未连接' }}</span>
    </div>

    <div class="form-group">
      <label>网格大小: {{ localParams.gridSize }} × {{ localParams.gridSize }}</label>
      <input 
        type="range" 
        v-model.number="localParams.gridSize" 
        :min="20" 
        :max="80" 
        :step="10"
        :disabled="isRunning"
      />
    </div>

    <div class="form-group">
      <label>人口密度: {{ (localParams.populationDensity * 100).toFixed(0) }}%</label>
      <input 
        type="range" 
        v-model.number="localParams.populationDensity" 
        :min="0.1" 
        :max="0.8" 
        :step="0.05"
        :disabled="isRunning"
      />
    </div>

    <div class="form-group">
      <label>初始感染人数: {{ localParams.initialInfected }}</label>
      <input 
        type="range" 
        v-model.number="localParams.initialInfected" 
        :min="1" 
        :max="50" 
        :step="1"
        :disabled="isRunning"
      />
    </div>

    <div class="form-group">
      <label>感染率: {{ (localParams.infectionRate * 100).toFixed(1) }}%</label>
      <input 
        type="range" 
        v-model.number="localParams.infectionRate" 
        :min="0.001" 
        :max="0.1" 
        :step="0.005"
        @input="handleParamChange"
      />
    </div>

    <div class="form-group">
      <label>恢复率: {{ (localParams.recoveryRate * 1000).toFixed(1) }}‰</label>
      <input 
        type="range" 
        v-model.number="localParams.recoveryRate" 
        :min="0.001" 
        :max="0.02" 
        :step="0.001"
        @input="handleParamChange"
      />
    </div>

    <div class="form-group">
      <label>隔离政策执行率: {{ (localParams.quarantinePolicy * 100).toFixed(0) }}%</label>
      <input 
        type="range" 
        v-model.number="localParams.quarantinePolicy" 
        :min="0" 
        :max="1" 
        :step="0.1"
        @input="handleParamChange"
      />
    </div>

    <div class="form-group">
      <label>出行频率: {{ (localParams.travelFrequency * 100).toFixed(0) }}%</label>
      <input 
        type="range" 
        v-model.number="localParams.travelFrequency" 
        :min="0.001" 
        :max="0.1" 
        :step="0.005"
        @input="handleParamChange"
      />
    </div>

    <div class="form-group">
      <label>医院容量: {{ localParams.hospitalCapacity }} 人</label>
      <input 
        type="range" 
        v-model.number="localParams.hospitalCapacity" 
        :min="10" 
        :max="500" 
        :step="10"
        @input="handleParamChange"
      />
    </div>

    <div class="form-group">
      <label>疫苗覆盖率: {{ (localParams.vaccineCoverage * 100).toFixed(0) }}%</label>
      <input 
        type="range" 
        v-model.number="localParams.vaccineCoverage" 
        :min="0" 
        :max="0.9" 
        :step="0.05"
        :disabled="isRunning"
      />
    </div>

    <div class="button-group">
      <button 
        v-if="!isRunning" 
        class="btn btn-primary"
        @click="start"
      >
        ▶ 开始模拟
      </button>
      <template v-else>
        <button 
          v-if="!isPaused" 
          class="btn btn-warning"
          @click="pause"
        >
          ⏸ 暂停
        </button>
        <button 
          v-else 
          class="btn btn-success"
          @click="resume"
        >
          ▶ 继续
        </button>
      </template>
      <button 
        v-if="isRunning" 
        class="btn btn-danger"
        @click="stop"
      >
        ⏹ 停止
      </button>
    </div>

    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot susceptible"></div>
        <span>易感人群</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot infected"></div>
        <span>感染者</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot recovered"></div>
        <span>康复者</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot isolated"></div>
        <span>隔离者</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot vaccinated"></div>
        <span>疫苗接种</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useSimulation } from '../composables/useSimulation'

const {
  isConnected,
  isRunning,
  isPaused,
  params,
  connect,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  updateParams
} = useSimulation()

const localParams = ref({ ...params.value })

watch(params, (newVal) => {
  localParams.value = { ...newVal }
}, { deep: true })

onMounted(() => {
  connect()
})

const handleParamChange = () => {
  if (isRunning.value) {
    updateParams(localParams.value)
  }
}

const start = () => {
  updateParams(localParams.value)
  startSimulation()
}

const pause = () => {
  pauseSimulation()
}

const resume = () => {
  resumeSimulation()
}

const stop = () => {
  stopSimulation()
}
</script>
