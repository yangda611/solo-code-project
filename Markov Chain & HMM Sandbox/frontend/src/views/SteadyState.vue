<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">📊 稳态分布分析</h2>
      <button class="btn btn-primary" @click="calculateSteadyState">计算稳态分布</button>
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">稳态概率分布</h3>
      
      <div v-if="result.normalizedError" class="alert alert-danger">
        ⚠️ 归一化错误：概率总和 = {{ result.sumCheck.toFixed(4) }} ≠ 1
      </div>

      <div v-for="(prob, i) in result.steadyState" :key="i" style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
          <span style="font-weight: bold;">{{ result.stateLabels[i] }}</span>
          <span>{{ (prob * 100).toFixed(2) }}%</span>
        </div>
        <div class="probability-bar">
          <div class="probability-fill" 
               :style="{ 
                 width: (prob * 100) + '%',
                 background: getGradientColor(prob)
               }" />
          <span class="probability-label">{{ (prob * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <div v-if="hasCollapse()" class="alert alert-danger" style="margin-top: 1.5rem;">
        🔥 检测到概率坍塌：部分状态概率归零，系统被吸收态捕获
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🧭 状态转移图 (带流动粒子)</h3>
      <StateGraph :model="store.currentModel" :steadyState="result?.steadyState" />
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 1rem;">
        💡 观察粒子沿转移边流动的密度，直观展示转移概率的大小。吸收态的粒子只流入不流出。
      </p>
    </div>

    <div class="card">
      <h3 class="card-title">🔬 迭代收敛过程</h3>
      <div style="height: 300px; position: relative;">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { store } from '../store'
import StateGraph from '../components/StateGraph.vue'
import axios from 'axios'
import Chart from 'chart.js/auto'

export default {
  name: 'SteadyState',
  components: { StateGraph },
  setup() {
    const result = ref(null)
    const chartCanvas = ref(null)
    let chart = null

    const getGradientColor = (prob) => {
      if (prob < 0.01) return '#ef4444'
      if (prob < 0.2) return '#f59e0b'
      if (prob < 0.5) return '#6366f1'
      return '#10b981'
    }

    const hasCollapse = () => {
      return result.value?.steadyState.some(p => p < 0.01)
    }

    const simulateConvergence = () => {
      let pi = [...store.currentModel.initialDistribution]
      const history = [pi.slice()]
      
      for (let iter = 0; iter < 50; iter++) {
        const nextPi = new Array(pi.length).fill(0)
        for (let j = 0; j < pi.length; j++) {
          for (let i = 0; i < pi.length; i++) {
            nextPi[j] += pi[i] * store.currentModel.transitionMatrix[i][j]
          }
        }
        pi = nextPi
        history.push(pi.slice())
      }
      
      return history
    }

    const renderChart = (history) => {
      if (chart) chart.destroy()
      
      const ctx = chartCanvas.value.getContext('2d')
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: history.map((_, i) => i),
          datasets: store.currentModel.states.map((state, i) => ({
            label: state,
            data: history.map(h => h[i]),
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length] + '20',
            fill: true,
            tension: 0.4
          }))
        },
        options: {
          responsive: true,
          animation: {
            duration: 2000,
            easing: 'easeOutQuart'
          },
          plugins: {
            title: {
              display: true,
              text: '稳态分布迭代收敛过程',
              color: '#cdd6f4'
            },
            legend: {
              labels: { color: '#cdd6f4' }
            }
          },
          scales: {
            x: {
              title: { display: true, text: '迭代次数', color: '#cdd6f4' },
              ticks: { color: '#6c7086' },
              grid: { color: '#313244' }
            },
            y: {
              title: { display: true, text: '概率', color: '#cdd6f4' },
              ticks: { color: '#6c7086' },
              grid: { color: '#313244' },
              min: 0,
              max: 1
            }
          }
        }
      })
    }

    const calculateSteadyState = async () => {
      try {
        const response = await axios.post('/api/hmm/steady-state', store.currentModel)
        result.value = response.data
        
        const history = simulateConvergence()
        renderChart(history)
      } catch (error) {
        console.error('计算失败:', error)
      }
    }

    onMounted(() => {
      calculateSteadyState()
    })

    return { store, result, chartCanvas, getGradientColor, hasCollapse, calculateSteadyState }
  }
}
</script>
