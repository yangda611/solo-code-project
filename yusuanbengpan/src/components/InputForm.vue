<template>
  <div class="input-form">
    <div class="form-section">
      <h3 class="section-title">基本设置</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">月收入 (¥)</label>
          <input 
            type="number" 
            v-model.number="localMonthlyIncome"
            class="form-input"
            min="0"
            step="100"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">初始存款 (¥)</label>
          <input 
            type="number" 
            v-model.number="localInitialSavings"
            class="form-input"
            min="0"
            step="1000"
          />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">警戒线金额 (¥)</label>
          <input 
            type="number" 
            v-model.number="localWarningThreshold"
            class="form-input"
            min="0"
            step="500"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h3 class="section-title">随机支出范围</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">最低 (¥)</label>
          <input 
            type="number" 
            v-model.number="localRandomMin"
            class="form-input"
            min="0"
            step="100"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label">最高 (¥)</label>
          <input 
            type="number" 
            v-model.number="localRandomMax"
            class="form-input"
            min="0"
            step="100"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h3 class="section-title">突发事件设置</h3>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">每月发生概率 (%)</label>
          <input 
            type="range" 
            v-model.number="localEmergencyProb"
            class="form-slider"
            min="0"
            max="100"
            step="5"
          />
          <span class="slider-value">{{ localEmergencyProb }}%</span>
        </div>
        
        <div class="form-group">
          <label class="form-label">突发事件费用 (¥)</label>
          <input 
            type="number" 
            v-model.number="localEmergencyAmount"
            class="form-input"
            min="0"
            step="500"
          />
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button 
        class="btn btn-primary" 
        @click="runSimulation"
        :disabled="isSimulating"
      >
        {{ isSimulating ? '模拟中...' : '开始模拟' }}
      </button>
      <button 
        class="btn btn-secondary" 
        @click="clearData"
      >
        重置数据
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  monthlyIncome: {
    type: Number,
    required: true
  },
  initialSavings: {
    type: Number,
    required: true
  },
  warningThreshold: {
    type: Number,
    required: true
  },
  randomExpenseRange: {
    type: Object,
    required: true
  },
  emergencyProbability: {
    type: Number,
    required: true
  },
  emergencyAmount: {
    type: Number,
    required: true
  },
  isSimulating: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:monthlyIncome', 'update:initialSavings', 
  'update:warningThreshold', 'update:randomExpenseRange', 
  'update:emergencyProbability', 'update:emergencyAmount', 'runSimulation', 'clearData'])

const localMonthlyIncome = ref(props.monthlyIncome)
const localInitialSavings = ref(props.initialSavings)
const localWarningThreshold = ref(props.warningThreshold)
const localRandomMin = ref(props.randomExpenseRange.min)
const localRandomMax = ref(props.randomExpenseRange.max)
const localEmergencyProb = ref(props.emergencyProbability)
const localEmergencyAmount = ref(props.emergencyAmount)

watch(() => props.monthlyIncome, (val) => { localMonthlyIncome.value = val })
watch(() => props.initialSavings, (val) => { localInitialSavings.value = val })
watch(() => props.warningThreshold, (val) => { localWarningThreshold.value = val })
watch(() => props.randomExpenseRange, (val) => { 
  localRandomMin.value = val.min 
  localRandomMax.value = val.max 
}, { deep: true })
watch(() => props.emergencyProbability, (val) => { localEmergencyProb.value = val })
watch(() => props.emergencyAmount, (val) => { localEmergencyAmount.value = val })

watch(localMonthlyIncome, (val) => emit('update:monthlyIncome', val))
watch(localInitialSavings, (val) => emit('update:initialSavings', val))
watch(localWarningThreshold, (val) => emit('update:warningThreshold', val))
watch(localRandomMin, (val) => emit('update:randomExpenseRange', { min: val, max: localRandomMax.value }))
watch(localRandomMax, (val) => emit('update:randomExpenseRange', { min: localRandomMin.value, max: val }))
watch(localEmergencyProb, (val) => emit('update:emergencyProbability', val))
watch(localEmergencyAmount, (val) => emit('update:emergencyAmount', val))

const runSimulation = () => emit('runSimulation')
const clearData = () => emit('clearData')
</script>

<style scoped>
.input-form {
  padding: 20px;
}

.form-section {
  background: var(--card-bg, #f9f9f9);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid var(--border, #e0e0e0);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h, #333);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent, #6366f1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: var(--text, #666);
  font-weight: 500;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s, box-shadow 0.3s;
  background: var(--bg, #fff);
  color: var(--text-h, #333);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border, #e0e0e0);
  outline: none;
  -webkit-appearance: none;
}

.form-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent, #6366f1);
  cursor: pointer;
  transition: transform 0.2s;
}

.form-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider-value {
  align-self: flex-end;
  font-size: 14px;
  color: var(--accent, #6366f1);
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--accent, #6366f1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-dark, #4f46e5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--card-bg, #f0f0f0);
  color: var(--text, #666);
  border: 2px solid var(--border, #e0e0e0);
}

.btn-secondary:hover {
  background: var(--border, #e0e0e0);
  transform: translateY(-2px);
}
</style>
