<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">📈 Baum-Welch 参数学习</h2>
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
        <label style="margin: 0;">最大迭代次数:</label>
        <input type="number" v-model.number="maxIterations" min="1" max="200" 
               style="width: 100px;" />
        <button class="btn btn-primary" @click="runBaumWelch">开始训练</button>
      </div>
    </div>

    <div v-if="estimationWarning" class="alert alert-danger underflow-warning">
      ⚠️ 参数估计失败：零概率转移导致学习中断
    </div>

    <div v-if="overfittingWarning" class="alert alert-warning underflow-warning" style="top: 80px;">
      ⚠️ 检测到过拟合震荡：稀疏数据导致似然值波动异常
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">似然收敛曲线</h3>
      <div style="height: 300px; position: relative;">
        <canvas ref="likelihoodCanvas"></canvas>
      </div>
      
      <div style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <div class="tag" :class="result.likelihoodHistory.length < maxIterations ? 'tag-success' : 'tag-warning'">
          迭代次数: {{ result.likelihoodHistory.length }}
        </div>
        <div class="tag tag-primary">
          最终似然: {{ result.likelihoodHistory[result.likelihoodHistory.length - 1]?.toExponential(4) }}
        </div>
        <div v-if="result.zeroProbTransitions" class="tag tag-danger">存在零概率转移</div>
      </div>
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">🔄 学习前后转移矩阵对比</h3>
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <h4 style="color: #f59e0b; margin-bottom: 1rem;">训练前 A</h4>
          <div v-for="(row, i) in store.currentModel.transitionMatrix" :key="'old-row-' + i"
               style="display: flex; gap: 4px; margin-bottom: 4px; align-items: center;">
            <span style="width: 70px; font-size: 12px;">{{ store.currentModel.states[i] }}</span>
            <div v-for="(cell, j) in row" :key="'old-' + i + '-' + j"
                 :style="{
                   width: '50px',
                   height: '30px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '4px',
                   fontSize: '11px',
                   background: getProbColor(cell, 'orange'),
                   color: 'white',
                   textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                 }">
              {{ (cell * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
        <div>
          <h4 style="color: #10b981; margin-bottom: 1rem;">训练后 A'</h4>
          <div v-for="(row, i) in result.learnedTransitionMatrix" :key="'new-row-' + i"
               style="display: flex; gap: 4px; margin-bottom: 4px; align-items: center;">
            <span style="width: 70px; font-size: 12px;">{{ store.currentModel.states[i] }}</span>
            <div v-for="(cell, j) in row" :key="'new-' + i + '-' + j"
                 :style="{
                   width: '50px',
                   height: '30px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '4px',
                   fontSize: '11px',
                   background: getProbColor(cell, 'green'),
                   color: 'white',
                   textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                   border: hasChanged(i, j) ? '2px solid white' : 'none'
                 }">
              {{ (cell * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">📤 学习前后发射矩阵对比</h3>
      <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <h4 style="color: #f59e0b; margin-bottom: 1rem;">训练前 B</h4>
          <div v-for="(row, i) in store.currentModel.emissionMatrix" :key="'old-emit-row-' + i"
               style="display: flex; gap: 4px; margin-bottom: 4px; align-items: center;">
            <span style="width: 70px; font-size: 12px;">{{ store.currentModel.states[i] }}</span>
            <div v-for="(cell, j) in row" :key="'old-emit-' + i + '-' + j"
                 :style="{
                   width: '50px',
                   height: '30px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '4px',
                   fontSize: '11px',
                   background: getProbColor(cell, 'purple'),
                   color: 'white'
                 }">
              {{ (cell * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
        <div>
          <h4 style="color: #10b981; margin-bottom: 1rem;">训练后 B'</h4>
          <div v-for="(row, i) in result.learnedEmissionMatrix" :key="'new-emit-row-' + i"
               style="display: flex; gap: 4px; margin-bottom: 4px; align-items: center;">
            <span style="width: 70px; font-size: 12px;">{{ store.currentModel.states[i] }}</span>
            <div v-for="(cell, j) in row" :key="'new-emit-' + i + '-' + j"
                 :style="{
                   width: '50px',
                   height: '30px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   borderRadius: '4px',
                   fontSize: '11px',
                   background: getProbColor(cell, 'teal'),
                   color: 'white',
                   border: hasEmitChanged(i, j) ? '2px solid white' : 'none'
                 }">
              {{ (cell * 100).toFixed(0) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="result?.estimationFailed" class="card" style="border-color: #ef4444;">
      <h3 class="card-title" style="color: #ef4444;">❌ 参数学习失败分析</h3>
      <p style="color: #fca5a5; margin-bottom: 1rem;">
        检测到零概率转移导致EM算法无法正确更新参数。
      </p>
      <div class="alert alert-danger">
        💡 建议：在转移矩阵中添加小的平滑概率（如 1e-6），避免零概率问题。
      </div>
    </div>

    <div v-if="result?.overfittingDetected" class="card" style="border-color: #f59e0b;">
      <h3 class="card-title" style="color: #f59e0b;">⚠️ 过拟合风险分析</h3>
      <p style="color: #fcd34d; margin-bottom: 1rem;">
        似然值出现剧烈震荡，可能是由于训练数据过于稀疏导致的过拟合现象。
      </p>
      <div class="alert alert-warning">
        💡 建议：增加观测序列长度，或使用正则化方法约束参数更新幅度。
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
  name: 'BaumWelch',
  setup() {
    const result = ref(null)
    const maxIterations = ref(50)
    const estimationWarning = ref(false)
    const overfittingWarning = ref(false)
    const likelihoodCanvas = ref(null)
    let likelihoodChart = null

    const colorSchemes = {
      orange: (p) => `hsl(35, ${50 + p * 50}%, ${30 + p * 30}%)`,
      green: (p) => `hsl(142, ${50 + p * 50}%, ${25 + p * 30}%)`,
      purple: (p) => `hsl(262, ${50 + p * 50}%, ${35 + p * 25}%)`,
      teal: (p) => `hsl(172, ${50 + p * 50}%, ${30 + p * 25}%)`
    }

    const getProbColor = (prob, scheme) => {
      return colorSchemes[scheme](Math.min(prob, 1))
    }

    const hasChanged = (i, j) => {
      if (!result.value) return false
      const oldVal = store.currentModel.transitionMatrix[i][j]
      const newVal = result.value.learnedTransitionMatrix[i][j]
      return Math.abs(oldVal - newVal) > 0.05
    }

    const hasEmitChanged = (i, j) => {
      if (!result.value) return false
      const oldVal = store.currentModel.emissionMatrix[i][j]
      const newVal = result.value.learnedEmissionMatrix[i][j]
      return Math.abs(oldVal - newVal) > 0.05
    }

    const renderLikelihoodChart = () => {
      if (!result.value) return
      if (likelihoodChart) likelihoodChart.destroy()
      
      const ctx = likelihoodCanvas.value.getContext('2d')
      
      likelihoodChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: result.value.likelihoodHistory.map((_, i) => i),
          datasets: [{
            label: 'P(O | λ)',
            data: result.value.likelihoodHistory,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#6366f1'
          }]
        },
        options: {
          responsive: true,
          animation: {
            duration: 3000,
            easing: 'easeOutQuart'
          },
          plugins: {
            title: {
              display: true,
              text: '似然值随迭代次数变化',
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
              title: { display: true, text: '似然值 P(O | λ)', color: '#cdd6f4' },
              ticks: { color: '#6c7086' },
              grid: { color: '#313244' }
            }
          }
        }
      })
    }

    const runBaumWelch = async () => {
      try {
        estimationWarning.value = false
        overfittingWarning.value = false
        
        const response = await axios.post('/api/hmm/baum-welch', {
          ...store.currentModel,
          maxIterations: maxIterations.value
        })
        result.value = response.data
        
        if (response.data.estimationFailed) {
          setTimeout(() => { estimationWarning.value = true }, 500)
        }
        if (response.data.overfittingDetected) {
          setTimeout(() => { overfittingWarning.value = true }, 500)
        }
        
        setTimeout(renderLikelihoodChart, 300)
      } catch (error) {
        console.error('训练失败:', error)
      }
    }

    onMounted(() => {
      runBaumWelch()
    })

    return { 
      store, result, maxIterations, estimationWarning, overfittingWarning,
      likelihoodCanvas, getProbColor, hasChanged, hasEmitChanged, runBaumWelch 
    }
  }
}
</script>
