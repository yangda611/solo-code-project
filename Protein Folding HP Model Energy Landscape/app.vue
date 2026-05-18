<template>
  <div class="h-screen w-screen bg-space-dark text-white overflow-hidden">
    <header class="h-16 border-b border-glass-border flex items-center px-6 justify-between">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🧬</span>
        <h1 class="font-orbitron text-2xl text-gradient">
          HP 格点模型蛋白质折叠模拟器
        </h1>
      </div>
      <div class="flex items-center gap-4 text-sm font-roboto-mono">
        <span class="text-white/60">基于 Metropolis 蒙特卡洛算法</span>
        <span class="px-3 py-1 bg-bio-blue/20 text-bio-blue rounded-full border border-bio-blue/30">
          v1.0
        </span>
      </div>
    </header>

    <main class="h-[calc(100vh-4rem)] grid grid-cols-[280px_1fr_320px] gap-4 p-4">
      <aside class="h-full overflow-hidden">
        <ControlPanel />
      </aside>

      <section class="h-full flex flex-col gap-4">
        <div class="flex-1 rounded-lg overflow-hidden">
          <ProteinViewer />
        </div>
        <div class="h-48">
          <PresetButtons />
        </div>
      </section>

      <aside class="h-full overflow-hidden">
        <EnergyChart />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import ProteinViewer from '~/components/ProteinViewer.vue';
import ControlPanel from '~/components/ControlPanel.vue';
import EnergyChart from '~/components/EnergyChart.vue';
import PresetButtons from '~/components/PresetButtons.vue';
</script>
