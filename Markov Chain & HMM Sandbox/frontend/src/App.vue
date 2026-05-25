<template>
  <div id="app">
    <nav>
      <div class="nav-container">
        <div class="logo">🔬 HMM 状态机建模系统</div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/presets" class="nav-link">预设案例</router-link>
          <router-link to="/editor" class="nav-link">模型编辑</router-link>
          <router-link to="/steady-state" class="nav-link">稳态分布</router-link>
          <router-link to="/viterbi" class="nav-link">Viterbi</router-link>
          <router-link to="/posterior" class="nav-link">后验概率</router-link>
          <router-link to="/baum-welch" class="nav-link">Baum-Welch</router-link>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
