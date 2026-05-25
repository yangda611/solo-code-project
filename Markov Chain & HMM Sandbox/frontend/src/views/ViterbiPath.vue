<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">🛤️ Viterbi 最优路径解码</h2>
      <button class="btn btn-primary" @click="calculateViterbi">计算最优路径</button>
    </div>

    <div v-if="underflowWarning" class="alert alert-danger underflow-warning">
      ⚠️ 数值下溢警告：概率值趋近于零，可能导致精度丢失
    </div>

    <div v-if="result" class="card">
      <h3 class="card-title">最可能的隐藏状态序列</h3>
      
      <div class="sequence-display" style="margin-bottom: 1.5rem;">
        <div v-for="(state, i) in result.path" :key="i" 
             class="sequence-item"
             :style="{ 
               borderColor: stateColors[store.currentModel.states.indexOf(state) % stateColors.length],
               background: stateColors[store.currentModel.states.indexOf(state) % stateColors.length] + '30'
             }">
          t={{ i }}: <strong>{{ state }}</strong>
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <strong>路径概率: </strong>
        <span :style="{ color: result.probability < 1e-10 ? '#ef4444' : '#10b981' }">
          {{ result.probability.toExponential(4) }}
        </span>
        <span v-if="result.probability < 1e-10" class="tag tag-danger" style="margin-left: 0.5rem;">数值下溢</span>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🔍 路径动态追踪动画</h3>
      <div class="particles-container" ref="pathContainer">
        <svg :width="800" :height="400" style="position: absolute; top: 0; left: 0;">
          <g v-for="(obs, t) in store.currentModel.observationSequence.slice(0, 20)" :key="'time-' + t">
            <line :x1="50 + t * 35" :y1="50" :x2="50 + t * 35" :y2="350" 
                  stroke="#45475a" stroke-width="1" stroke-dasharray="4" />
            <text :x="50 + t * 35" y="370" text-anchor="middle" fill="#6c7086" font-size="12">
              {{ obs }}
            </text>
          </g>

          <g v-for="(state, i) in store.currentModel.states" :key="'state-line-' + i">
            <line x1="30" :y1="80 + i * 60" x2="770" :y2="80 + i * 60"
                  stroke="#45475a" stroke-width="1" />
            <text x="20" :y="85 + i * 60" fill="#cdd6f4" font-size="12" text-anchor="end">
              {{ state }}
            </text>
          </g>

          <polyline v-if="result" :points="pathPoints"
                    fill="none" stroke="#10b981" stroke-width="3"
                    stroke-linecap="round" stroke-linejoin="round"
                    class="viterbi-path path-highlight"
                    :style="{ filter: 'drop-shadow(0 0 10px #10b981)' }" />

          <circle v-for="(point, i) in animatedPoints" :key="'point-' + i"
                  :cx="point.x" :cy="point.y" r="8"
                  fill="#10b981" class="data-point"
                  :style="{ animationDelay: (i * 0.1) + 's' }" />
        </svg>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">📉 Delta 矩阵热力图</h3>
      <div style="overflow-x: auto;">
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div v-for="(row, stateIdx) in store.currentModel.states" :key="'delta-row-' + stateIdx"
               style="display: flex; gap: 2px; align-items: center;">
            <div style="width: 60px; font-size: 12px; color: #cdd6f4;">{{ row }}</div>
            <div v-for="(time, t) in Math.min(result?.delta?.length || 0, 20)" :key="'delta-cell-' + t"
                 class="heatmap-cell"
                 :style="getCellStyle(stateIdx, t)"
                 :title="`t=${t}, value=${result.delta[t][stateIdx].toExponential(4)}`">
              <span v-if="isInPath(stateIdx, t)" style="position: absolute; color: white; font-weight: bold; font-size: 10px;">✓</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding: 0 60px;">
        <span style="color: #ef4444;">低概率</span>
        <div style="flex: 1; height: 20px; margin: 0 1rem; background: linear-gradient(90deg, #1e1e2e, #6366f1, #10b981); border-radius: 4px;"></div>
        <span style="color: #10b981;">高概率</span>
      </div>
    </div>

    <div v-if="result?.overflowDetected" class="card" style="border-color: #ef4444;">
      <h3 class="card-title" style="color: #ef4444;">⚠️ 数值稳定性分析</h3>
      <p style="color: #fca5a5;">
        检测到潜在的数值下溢问题。长观测序列导致概率值指数衰减，最终超出浮点数精度范围。
      </p>
      <div class="alert alert-danger" style="margin-top: 1rem;">
        💡 建议使用对数空间中的Viterbi算法来避免这个问题。
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { store } from '../store'
import axios from 'axios'

export default {
  name: 'ViterbiPath',
  setup() {
    const result = ref(null)
    const underflowWarning = ref(false)
    const pathContainer = ref(null)
    const animatedPoints = ref([])

    const stateColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    const pathPoints = computed(() => {
      if (!result.value) return ''
      return result.value.path.slice(0, 20).map((state, t) => {
        const stateIdx = store.currentModel.states.indexOf(state)
        return `${50 + t * 35},${80 + stateIdx * 60}`
      }).join(' ')
    })

    const getCellStyle = (stateIdx, t) => {
      if (!result.value) return {}
      const delta = result.value.delta[t][stateIdx]
      const maxDelta = Math.max(...result.value.delta[t])
      const normalized = maxDelta > 0 ? delta / maxDelta : 0
      
      const r = Math.floor(30 + normalized * 16)
      const g = Math.floor(30 + normalized * 185)
      const b = Math.floor(46 + normalized * (241 - 46))
      
      return {
        width: '33px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        fontSize: '10px',
        background: `rgb(${r}, ${g}, ${b})`,
        position: 'relative',
        border: isInPath(stateIdx, t) ? '2px solid #10b981' : 'none',
        transition: 'all 0.3s ease'
      }
    }

    const isInPath = (stateIdx, t) => {
      if (!result.value) return false
      return store.currentModel.states.indexOf(result.value.path[t]) === stateIdx
    }

    const animatePoints = () => {
      animatedPoints.value = []
      if (!result.value) return
      
      result.value.path.slice(0, 20).forEach((state, t) => {
        setTimeout(() => {
          const stateIdx = store.currentModel.states.indexOf(state)
          animatedPoints.value.push({
            x: 50 + t * 35,
            y: 80 + stateIdx * 60
          })
        }, t * 100)
      })
    }

    const calculateViterbi = async () => {
      try {
        underflowWarning.value = false
        const response = await axios.post('/api/hmm/viterbi', store.currentModel)
        result.value = response.data
        
        if (response.data.overflowDetected) {
          setTimeout(() => {
            underflowWarning.value = true
          }, 500)
        }
        
        setTimeout(animatePoints, 500)
      } catch (error) {
        console.error('计算失败:', error)
      }
    }

    onMounted(() => {
      calculateViterbi()
    })

    return { 
      store, result, underflowWarning, pathContainer,
      pathPoints, animatedPoints, stateColors,
      getCellStyle, isInPath, calculateViterbi
    }
  }
}
</script>
