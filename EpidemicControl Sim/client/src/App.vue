<template>
  <div class="app-container">
    <header class="header">
      <h1>🦠 城市人群传播模拟平台</h1>
      <p>实时模拟病毒在城市人群中的传播过程</p>
    </header>

    <div class="main-content">
      <ControlPanel />
      
      <div class="simulation-area">
        <StatsPanel />
        <SimulationCanvas />
        <ChartsPanel />
      </div>
    </div>
  </div>
</template>

<script setup>
import ControlPanel from './components/ControlPanel.vue'
import StatsPanel from './components/StatsPanel.vue'
import SimulationCanvas from './components/SimulationCanvas.vue'
import ChartsPanel from './components/ChartsPanel.vue'
</script>
