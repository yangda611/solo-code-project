<template>
  <div class="glass-panel p-4">
    <h2 class="font-orbitron text-xl text-bio-blue mb-4 flex items-center gap-2">
      <span>🎯</span> 预设场景
    </h2>

    <div class="grid grid-cols-1 gap-3">
      <button
        v-for="preset in presets"
        :key="preset.id"
        @click="loadPreset(preset)"
        class="preset-btn text-left hover:border-bio-blue hover:shadow-glow-blue transition-all duration-300"
      >
        <div class="font-orbitron text-sm text-white mb-1">{{ preset.name }}</div>
        <div class="text-xs text-white/60 mb-2">{{ preset.description }}</div>
        <div class="text-xs text-green-400/80 italic">💡 {{ preset.phenomenon }}</div>
      </button>
    </div>

    <div class="mt-4 p-3 bg-space-blue/50 rounded-lg text-xs">
      <div class="font-orbitron text-bio-blue mb-2">🔬 可观察现象</div>
      <ul class="space-y-1 text-white/70">
        <li>• 格点模型的构象空间离散化</li>
        <li>• 温度下降过快导致的动力学陷阱</li>
        <li>• 疏水核形成时的熵-焓补偿</li>
        <li>• 链长增加时的构象搜索难度</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { presetScenarios } from '~/presets/scenarios';
import { useSimulationStore } from '~/composables/useSimulationStore';
import { useSimulation } from '~/composables/useSimulation';

const store = useSimulationStore();
const sim = useSimulation();

const presets = presetScenarios;

const loadPreset = (preset: typeof presets[0]) => {
  store.loadPreset(preset.params);
};
</script>
