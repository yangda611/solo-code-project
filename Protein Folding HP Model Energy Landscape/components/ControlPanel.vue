<template>
  <div class="h-full glass-panel p-4 overflow-y-auto scrollbar-thin">
    <h2 class="font-orbitron text-xl text-bio-blue mb-4 flex items-center gap-2">
      <span>⚛️</span> 控制面板
    </h2>

    <div class="mb-6">
      <h3 class="font-orbitron text-sm text-white/80 mb-3">模拟控制</h3>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="!store.state.isRunning"
          @click="sim.start()"
          class="btn-primary flex-1"
        >
          ▶️ 开始
        </button>
        <template v-else>
          <button
            v-if="!store.state.isPaused"
            @click="sim.pause()"
            class="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-all"
          >
            ⏸️ 暂停
          </button>
          <button
            v-else
            @click="sim.resume()"
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all"
          >
            ▶️ 继续
          </button>
        </template>
        <button @click="sim.reset()" class="btn-secondary flex-1">
          🔄 重置
        </button>
        <button @click="sim.singleStep()" class="btn-secondary w-full">
          ⏭️ 单步
        </button>
      </div>
    </div>

    <div class="mb-6 space-y-4">
      <h3 class="font-orbitron text-sm text-white/80 mb-3">模拟参数</h3>

      <div>
        <label class="flex justify-between text-sm mb-1">
        <span>疏水作用强度</span>
        <span class="text-bio-blue">{{ store.state.params.hydrophobicStrength.toFixed(2) }}</span>
        </label>
        <input
          v-model.number="store.state.params.hydrophobicStrength"
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          class="control-slider"
          @change="sim.reset()"
        >
      </div>

      <div>
        <label class="flex justify-between text-sm mb-1">
        <span>初始温度</span>
        <span class="text-energy-orange">{{ store.state.params.initialTemperature.toFixed(1) }}</span>
        </label>
        <input
          v-model.number="store.state.params.initialTemperature"
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          class="control-slider"
          @change="sim.reset()"
        >
      </div>

      <div>
        <label class="flex justify-between text-sm mb-1">
        <span>冷却速率</span>
        <span class="text-green-400">{{ store.state.params.coolingRate.toFixed(3) }}</span>
        </label>
        <input
          v-model.number="store.state.params.coolingRate"
          type="range"
          min="0.95"
          max="1"
          step="0.005"
          class="control-slider"
          @change="sim.reset()"
        >
      </div>
    </div>

    <div class="mb-6 p-3 bg-space-blue/50 rounded-lg">
      <h3 class="font-orbitron text-sm text-white/80 mb-2">实时状态</h3>
      <div class="grid grid-cols-2 gap-2 text-xs font-roboto-mono">
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-white/60">步数:</span>
            <span class="text-white">{{ store.state.step }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">温度:</span>
            <span class="text-energy-orange">{{ store.state.temperature.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">能量:</span>
            <span class="text-bio-blue">{{ store.state.energy.toFixed(2) }}</span>
          </div>
        </div>
        <div class="space-y-1">
          <div class="flex justify-between">
            <span class="text-white/60">接触数:</span>
            <span class="text-green-400">{{ store.state.nativeContacts }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">接受:</span>
            <span class="text-green-400">{{ store.state.acceptedMoves }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">拒绝:</span>
            <span class="text-red-400">{{ store.state.rejectedMoves }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <h3 class="font-orbitron text-sm text-white/80 mb-3">序列信息</h3>
      <div class="flex flex-wrap gap-1 max-h-20 overflow-y-auto p-2 bg-space-blue/30 rounded">
        <span
          v-for="(res, i) in store.state.sequence"
          :key="i"
          :class="[
            'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
            res === 'H' ? 'bg-hydrophobic text-white' : 'bg-polar text-white'
          ]"
          :title="res === 'H' ? '疏水 (Hydrophobic)' : '极性 (Polar)'"
        >
          {{ res }}
        </span>
      </div>
      <p class="text-xs text-white/50 mt-2">
        链长: {{ store.state.sequence.length }} | 红色=疏水 蓝色=极性
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSimulationStore } from '~/composables/useSimulationStore';
import { useSimulation } from '~/composables/useSimulation';

const store = useSimulationStore();
const sim = useSimulation();
</script>
