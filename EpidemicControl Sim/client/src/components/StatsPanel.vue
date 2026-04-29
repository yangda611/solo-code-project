<template>
  <div class="stats-panel">
    <div class="stats-grid">
      <div class="stat-item susceptible">
        <div class="label">易感人群</div>
        <div class="value">{{ stats.susceptible }}</div>
      </div>
      <div class="stat-item infected">
        <div class="label">感染者</div>
        <div class="value">{{ stats.infected }}</div>
      </div>
      <div class="stat-item recovered">
        <div class="label">康复者</div>
        <div class="value">{{ stats.recovered }}</div>
      </div>
      <div class="stat-item isolated">
        <div class="label">隔离者</div>
        <div class="value">{{ stats.isolated }}</div>
      </div>
      <div class="stat-item vaccinated">
        <div class="label">疫苗接种</div>
        <div class="value">{{ stats.vaccinated }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSimulation } from '../composables/useSimulation'

const { stats } = useSimulation()
</script>
