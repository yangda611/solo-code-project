<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">🔥 后验概率热力图</h2>
      <button class="btn btn-primary" @click="calculatePosterior">计算后验概率</button>
    </div>

    <div v-if="underflowWarning" class="alert alert-danger underflow-warning">
      ⚠️ 对数似然值过低，存在数值下溢风险
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">γ(t, i) = P(q_t = i | O, λ)</h3>
      <p style="color: var(--text-muted); margin-bottom: 1rem;">
        对数似然值: <span :style="{ color: result.logLikelihood < -10 ? '#ef4444' : '#10b981' }">
          {{ result.logLikelihood.toFixed(2) }}
        </span>
      </p>
      
      <div style="overflow-x: auto;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; gap: 4px; padding-left: 70px;">
            <div v-for="(obs, t) in store.currentModel.observationSequence.slice(0, 15)" :key="'t-' + t"
                 style="width: 45px; text-align: center; font-size: 11px; color: #6c7086;">
              t={{ t }}<br/><strong>{{ obs }}</strong>
            </div>
          </div>

          <div v-for="(state, i) in store.currentModel.states" :key="'state-' + i"
               style="display: flex; gap: 4px; align-items: center;">
            <div style="width: 65px; font-size: 12px; color: #cdd6f4; font-weight: bold;">
              {{ state }}
            </div>
            <div v-for="(time, t) in Math.min(result.gamma.length, 15)" :key="'cell-' + t"
                 class="heatmap-cell"
                 :style="getGammaStyle(i, t)"
                 @mouseenter="hoverCell = { t, i }"
                 @mouseleave="hoverCell = null">
              <span style="font-size: 10px; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                {{ (result.gamma[t][i] * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hoverCell" style="margin-top: 1rem; padding: 0.75rem; background: #313244; border-radius: 8px;">
        <strong>P({{ store.currentModel.states[hoverCell.i] }} | t={{ hoverCell.t }}) = 
          {{ (result.gamma[hoverCell.t][hoverCell.i] * 100).toFixed(2) }}%</strong>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; padding: 0 70px;">
        <span style="color: #6c7086;">低概率</span>
        <div style="flex: 1; height: 24px; margin: 0 1rem; background: linear-gradient(90deg, #1e1e2e, #6366f1, #10b981); border-radius: 4px;"></div>
        <span style="color: #10b981;">高概率</span>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🎨 状态概率演变动画</h3>
      <div style="height: 300px; position: relative;">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🔍 前向-α vs 后向-β 对比</h3>
      <div class="grid" style="grid-template-columns: 1fr 1fr;">
        <div>
          <h4 style="color: #6366f1; margin-bottom: 1rem;">前向概率 α(t, i)</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 2px;">
            <template v-if="result">
              <div v-for="t in Math.min(result.alpha.length, 15)" :key="'alpha-' + t"
                   style="display: flex; flex-direction: column; gap: 2px;">
                <div v-for="i in store.currentModel.states.length" :key="'alpha-' + t + '-' + i"
                     :style="{
                       width: '30px',
                       height: '20px',
                       borderRadius: '2px',
                       background: `hsl(${220}, ${Math.min(100, result.alpha[t-1][i-1] * 200)}%, ${30 + result.alpha[t-1][i-1] * 40}%)`
                     }" />
              </div>
            </template>
          </div>
        </div>
        <div>
          <h4 style="color: #10b981; margin-bottom: 1rem;">后向概率 β(t, i)</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 2px;">
            <template v-if="result">
              <div v-for="t in Math.min(result.beta.length, 15)" :key="'beta-' + t"
                   style="display: flex; flex-direction: column; gap: 2px;">
                <div v-for="i in store.currentModel.states.length" :key="'beta-' + t + '-' + i"
                     :style="{
                       width: '30px',
                       height: '20px',
                       borderRadius: '2px',
                       background: `hsl(${142}, ${Math.min(100, result.beta[t-1][i-1] * 200)}%, ${30 + result.beta[t-1][i-1] * 40}%)`
                     }" />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { store } from '../store'
import axios from 'axios'
import Chart from 'chart.js/auto'

export default {
  name: 'PosteriorProb',
  setup() {
    const result = ref(null)
    const underflowWarning = ref(false)
    const chartCanvas = ref(null)
    const hoverCell = ref(null)
    let chart = null

    const getGammaStyle = (i, t) => {
      if (!result.value) return {}
      const prob = result.value.gamma[t][i]
      
      const h = 220 + prob * (-80)
      const s = 50 + prob * 50
      const l = 20 + prob * 40
      
      return {
        width: '45px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        background: `hsl(${h}, ${s}%, ${l}%)`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: hoverCell.value?.t === t && hoverCell.value?.i === i 
          ? '2px solid white' 
          : 'none'
      }
    }

    const renderChart = () => {
      if (!result.value) return
      if (chart) chart.destroy()
      
      const ctx = chartCanvas.value.getContext('2d')
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      
      chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: result.value.gamma.map((_, i) => i),
          datasets: store.currentModel.states.map((state, i) => ({
            label: state,
            data: result.value.gamma.map(g => g[i]),
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length] + '40',
            fill: true,
            tension: 0.4
          }))
        },
        options: {
          responsive: true,
          animation: {
            duration: 2500,
            easing: 'easeOutQuart'
          },
          plugins: {
            title: {
              display: true,
              text: '各时刻状态后验概率演变',
              color: '#cdd6f4'
            },
            legend: {
              labels: { color: '#cdd6f4' }
            }
          },
          scales: {
            x: {
              title: { display: true, text: '时间步 t', color: '#cdd6f4' },
              ticks: { color: '#6c7086' },
              grid: { color: '#313244' }
            },
            y: {
              title: { display: true, text: '后验概率 γ(t, i)', color: '#cdd6f4' },
              ticks: { color: '#6c7086' },
              grid: { color: '#313244' },
              min: 0,
              max: 1
            }
          }
        }
      })
    }

    const calculatePosterior = async () => {
      try {
        underflowWarning.value = false
        const response = await axios.post('/api/hmm/posterior', store.currentModel)
        result.value = response.data
        
        if (response.data.underflowDetected) {
          setTimeout(() => {
            underflowWarning.value = true
          }, 500)
        }
        
        setTimeout(renderChart, 300)
      } catch (error) {
        console.error('计算失败:', error)
      }
    }

    onMounted(() => {
      calculatePosterior()
    })

    return { store, result, underflowWarning, chartCanvas, hoverCell, getGammaStyle, calculatePosterior }
  }
}
</script>
