<template>
  <div class="control-panel-card">
    <h3 class="control-panel-title">模拟控制</h3>
    
    <div class="control-buttons">
      <button 
        class="control-btn start"
        :disabled="simulationState === 'running'"
        @click="$emit('start')"
      >
        {{ simulationState === 'paused' ? '继续' : '开始' }}
      </button>
      <button 
        class="control-btn pause"
        :disabled="simulationState !== 'running'"
        @click="$emit('pause')"
      >
        暂停
      </button>
      <button 
        class="control-btn reset"
        @click="$emit('reset')"
      >
        重置
      </button>
    </div>
    
    <div class="speed-control">
      <div class="speed-label">模拟速度: {{ speed }}x</div>
      <input 
        type="range" 
        class="speed-slider"
        min="0.5" 
        max="3" 
        step="0.5"
        :value="speed"
        @input="handleSpeedChange"
      />
      <div class="speed-values">
        <span>0.5x</span>
        <span>1x</span>
        <span>1.5x</span>
        <span>2x</span>
        <span>2.5x</span>
        <span>3x</span>
      </div>
    </div>
    
    <div class="simulation-status" v-if="simulationState !== 'stopped'">
      <div class="status-item">
        <span class="status-label">状态:</span>
        <span :class="['status-value', simulationState]">
          {{ getStatusText() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ControlPanel',
  props: {
    simulationState: {
      type: String,
      default: 'stopped'
    },
    speed: {
      type: Number,
      default: 1
    }
  },
  emits: ['start', 'pause', 'reset', 'speed-change'],
  setup(props, { emit }) {
    const handleSpeedChange = (event) => {
      emit('speed-change', parseFloat(event.target.value))
    }
    
    const getStatusText = () => {
      const statusMap = {
        'stopped': '已停止',
        'running': '运行中',
        'paused': '已暂停'
      }
      return statusMap[props.simulationState] || props.simulationState
    }
    
    return {
      handleSpeedChange,
      getStatusText
    }
  }
}
</script>