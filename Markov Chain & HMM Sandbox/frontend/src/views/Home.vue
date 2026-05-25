<template>
  <div class="container">
    <div class="card">
      <h1 class="card-title">欢迎使用 HMM 状态机建模与推断系统</h1>
      <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
        本系统提供隐马尔可夫模型的完整建模、分析和可视化功能，包括稳态分布计算、Viterbi算法解码、
        后验概率估计以及Baum-Welch参数学习。
      </p>
    </div>

    <div class="grid">
      <div class="card preset-card" @click="$router.push('/steady-state')">
        <h3 class="card-title">📊 稳态分布分析</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          计算马尔可夫链的稳态概率分布，观察吸收态导致的概率坍塌现象
        </p>
        <div class="tags">
          <span class="tag tag-danger">吸收态检测</span>
          <span class="tag tag-warning">归一化验证</span>
        </div>
      </div>

      <div class="card preset-card" @click="$router.push('/viterbi')">
        <h3 class="card-title">🛤️ Viterbi 路径解码</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          寻找最可能的隐藏状态序列，动态展示最优路径的高亮描边动画
        </p>
        <div class="tags">
          <span class="tag tag-primary">动态高亮</span>
          <span class="tag tag-danger">下溢检测</span>
        </div>
      </div>

      <div class="card preset-card" @click="$router.push('/posterior')">
        <h3 class="card-title">🔥 后验概率热力图</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          前向后向算法计算后验概率，热力渐变动画展示每个时刻的状态分布
        </p>
        <div class="tags">
          <span class="tag tag-warning">渐变动画</span>
          <span class="tag tag-success">实时渲染</span>
        </div>
      </div>

      <div class="card preset-card" @click="$router.push('/baum-welch')">
        <h3 class="card-title">📈 Baum-Welch 参数学习</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          EM算法迭代学习模型参数，折线图逐帧动画展示似然收敛过程
        </p>
        <div class="tags">
          <span class="tag tag-primary">迭代优化</span>
          <span class="tag tag-danger">过拟合检测</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">💡 快速开始</h3>
      <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
        <div>
          <h4 style="margin-bottom: 0.75rem;">1. 加载预设案例</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">
            访问「预设案例」页面，选择四个内置演示案例之一
          </p>
          <button class="btn btn-primary" @click="$router.push('/presets')">
            查看预设
          </button>
        </div>
        <div>
          <h4 style="margin-bottom: 0.75rem;">2. 创建自定义模型</h4>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.5rem;">
            在「模型编辑」中定义自己的状态、观测和转移概率
          </p>
          <button class="btn btn-secondary" @click="$router.push('/editor')">
            创建模型
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>
