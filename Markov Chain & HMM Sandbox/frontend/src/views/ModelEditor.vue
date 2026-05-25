<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">✏️ 模型编辑器</h2>
      
      <div class="form-group">
        <label>模型名称</label>
        <input type="text" v-model="store.currentModel.name" />
      </div>

      <div class="grid">
        <div class="form-group">
          <label>状态列表 (逗号分隔)</label>
          <input type="text" :value="store.currentModel.states.join(', ')" 
                 @input="updateStates($event.target.value)" />
        </div>
        <div class="form-group">
          <label>观测列表 (逗号分隔)</label>
          <input type="text" :value="store.currentModel.observations.join(', ')" 
                 @input="updateObservations($event.target.value)" />
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🔄 转移概率矩阵</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        P(列状态 | 行状态) - 每行代表从对应状态转移到其他状态的概率
      </p>
      
      <div class="matrix-input">
        <div class="matrix-row" style="margin-left: 85px;">
          <div v-for="(state, j) in store.currentModel.states" :key="j" 
               class="matrix-cell" style="text-align: center; font-weight: bold; color: var(--primary);">
            → {{ state }}
          </div>
        </div>
        <div v-for="(row, i) in store.currentModel.transitionMatrix" :key="i" class="matrix-row">
          <div style="width: 80px; display: flex; align-items: center; font-weight: bold;">
            {{ store.currentModel.states[i] }}
            <span v-if="isAbsorbing(i)" class="absorbing-indicator" title="吸收态"></span>
          </div>
          <input v-for="(cell, j) in row" :key="j" type="number" step="0.01" min="0" max="1"
                 :value="cell" class="matrix-cell"
                 @input="store.updateTransitionMatrix(i, j, $event.target.value)"
                 :class="{ 'sum-error': rowSum(i) !== 1 && rowSum(i) !== 0 }" />
          <span :class="['matrix-cell', rowSum(i) !== 1 && rowSum(i) !== 0 ? 'sum-error' : '']"
                style="display: flex; align-items: center; justify-content: center; font-weight: bold;">
            = {{ rowSum(i).toFixed(2) }}
          </span>
        </div>
      </div>

      <div v-if="hasAbsorbingStates()" class="alert alert-warning" style="margin-top: 1rem;">
        ⚠️ 检测到吸收态 - 稳态分布可能出现概率坍塌现象
      </div>
      <div v-if="hasZeroProbTransitions()" class="alert alert-danger" style="margin-top: 1rem;">
        ⚠️ 检测到零概率转移 - Baum-Welch参数估计可能失败
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">📤 观测概率矩阵 (发射矩阵)</h3>
      <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
        P(观测 | 状态) - 每行代表对应状态发射各观测的概率
      </p>
      
      <div class="matrix-input">
        <div class="matrix-row" style="margin-left: 85px;">
          <div v-for="(obs, j) in store.currentModel.observations" :key="j" 
               class="matrix-cell" style="text-align: center; font-weight: bold; color: var(--secondary);">
            {{ obs }}
          </div>
        </div>
        <div v-for="(row, i) in store.currentModel.emissionMatrix" :key="i" class="matrix-row">
          <div style="width: 80px; display: flex; align-items: center; font-weight: bold;">
            {{ store.currentModel.states[i] }}
          </div>
          <input v-for="(cell, j) in row" :key="j" type="number" step="0.01" min="0" max="1"
                 :value="cell" class="matrix-cell"
                 @input="store.updateEmissionMatrix(i, j, $event.target.value)" />
          <span style="display: flex; align-items: center; justify-content: center; font-weight: bold; width: 80px;">
            = {{ rowSumEmit(i).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🎯 初始分布</h3>
      <div class="matrix-input">
        <div class="matrix-row">
          <div v-for="(prob, i) in store.currentModel.initialDistribution" :key="i">
            <label style="font-size: 0.8rem; margin-bottom: 0.25rem;">{{ store.currentModel.states[i] }}</label>
            <input type="number" step="0.01" min="0" max="1" :value="prob" class="matrix-cell"
                   @input="store.updateInitialDistribution(i, $event.target.value)" />
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">📝 观测序列</h3>
      <div class="form-group">
        <label>输入观测序列 (逗号分隔)</label>
        <input type="text" :value="store.currentModel.observationSequence.join(', ')" 
               @input="updateObsSequence($event.target.value)" />
      </div>
      <div class="sequence-display">
        <span v-for="(obs, i) in store.currentModel.observationSequence" :key="i" class="sequence-item">
          t={{ i }}: {{ obs }}
        </span>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🧭 状态转移可视化</h3>
      <StateGraph :model="store.currentModel" />
    </div>
  </div>
</template>

<script>
import { store } from '../store'
import StateGraph from '../components/StateGraph.vue'

export default {
  name: 'ModelEditor',
  components: { StateGraph },
  setup() {
    const updateStates = (value) => {
      const newStates = value.split(',').map(s => s.trim()).filter(s => s)
      if (newStates.length >= 2) {
        store.currentModel.states = newStates
      }
    }

    const updateObservations = (value) => {
      const newObs = value.split(',').map(s => s.trim()).filter(s => s)
      if (newObs.length >= 1) {
        store.currentModel.observations = newObs
      }
    }

    const updateObsSequence = (value) => {
      const seq = value.split(',').map(s => s.trim()).filter(s => s)
      store.currentModel.observationSequence = seq
    }

    const rowSum = (i) => {
      return store.currentModel.transitionMatrix[i].reduce((a, b) => a + b, 0)
    }

    const rowSumEmit = (i) => {
      return store.currentModel.emissionMatrix[i].reduce((a, b) => a + b, 0)
    }

    const isAbsorbing = (i) => {
      return store.currentModel.transitionMatrix[i][i] === 1
    }

    const hasAbsorbingStates = () => {
      return store.currentModel.transitionMatrix.some((row, i) => row[i] === 1)
    }

    const hasZeroProbTransitions = () => {
      return store.currentModel.transitionMatrix.some(row => row.some(p => p === 0))
    }

    return {
      store,
      updateStates,
      updateObservations,
      updateObsSequence,
      rowSum,
      rowSumEmit,
      isAbsorbing,
      hasAbsorbingStates,
      hasZeroProbTransitions
    }
  }
}
</script>
