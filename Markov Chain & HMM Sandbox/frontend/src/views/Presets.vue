<template>
  <div class="container">
    <div class="card">
      <h2 class="card-title">📦 预设案例库</h2>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
        选择一个预设案例来探索HMM的各种现象，包括吸收态、数值下溢、零概率和非遍历链等问题。
      </p>
    </div>

    <div class="grid">
      <div v-for="preset in presets" :key="preset.id" 
           class="card preset-card"
           @click="loadPreset(preset.id)">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
          <h3 class="card-title" style="margin: 0;">{{ preset.name }}</h3>
          <span :class="['tag', preset.tagClass]">{{ preset.tag }}</span>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          {{ preset.description }}
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="tag">状态: {{ preset.stateCount }}</span>
          <span class="tag">观测: {{ preset.obsCount }}</span>
          <span class="tag">序列长度: {{ preset.seqLength }}</span>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn btn-primary" style="width: 100%;">加载并使用</button>
        </div>
      </div>
    </div>

    <div v-if="selectedPreset" class="card" style="border-color: var(--success);">
      <h3 class="card-title">✅ 已加载: {{ selectedPreset.name }}</h3>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
        <button class="btn btn-secondary" @click="$router.push('/editor')">查看模型</button>
        <button class="btn btn-secondary" @click="$router.push('/steady-state')">稳态分析</button>
        <button class="btn btn-secondary" @click="$router.push('/viterbi')">Viterbi解码</button>
        <button class="btn btn-secondary" @click="$router.push('/posterior')">后验概率</button>
        <button class="btn btn-secondary" @click="$router.push('/baum-welch')">参数学习</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { store } from '../store'
import axios from 'axios'

export default {
  name: 'Presets',
  setup() {
    const presets = ref([
      {
        id: 'absorbing-collapse',
        name: '预设一：吸收态导致概率坍塌',
        description: '演示马尔可夫链中的吸收态如何导致系统最终收敛到单一状态，观察稳态分布中其他状态概率归零的"坍塌"现象。',
        tag: '吸收态',
        tagClass: 'tag-danger',
        stateCount: 3,
        obsCount: 3,
        seqLength: 10
      },
      {
        id: 'viterbi-overflow',
        name: '预设二：长序列的数值下溢',
        description: '长观测序列导致Viterbi算法中delta值指数衰减，最终发生数值下溢，展示浮点数精度问题。',
        tag: '数值下溢',
        tagClass: 'tag-warning',
        stateCount: 5,
        obsCount: 3,
        seqLength: 50
      },
      {
        id: 'zero-prob-failure',
        name: '预设三：零概率转移与过拟合',
        description: '转移矩阵中的零概率导致Baum-Welch算法参数估计失败，展示稀疏数据下的过拟合震荡现象。',
        tag: '零概率',
        tagClass: 'tag-danger',
        stateCount: 3,
        obsCount: 2,
        seqLength: 8
      },
      {
        id: 'dirichlet-bias',
        name: '预设四：非遍历链的先验偏差',
        description: '非遍历马尔可夫链（两个不连通子图）导致参数学习产生偏差，展示先验分布对结果的影响。',
        tag: '非遍历',
        tagClass: 'tag-primary',
        stateCount: 4,
        obsCount: 3,
        seqLength: 12
      }
    ])

    const selectedPreset = ref(null)

    const loadPreset = async (id) => {
      try {
        const response = await axios.get(`/api/presets/${id}`)
        store.setModel(response.data)
        selectedPreset.value = response.data
      } catch (error) {
        console.error('加载预设失败:', error)
      }
    }

    return { presets, selectedPreset, loadPreset }
  }
}
</script>
