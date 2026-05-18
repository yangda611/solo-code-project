<template>
  <div class="h-full glass-panel p-4 flex flex-col">
    <h2 class="font-orbitron text-xl text-bio-blue mb-4 flex items-center gap-2">
      <span>📊</span> 能量与温度
    </h2>

    <div class="flex-1 min-h-0 mb-4">
      <canvas ref="energyCanvasRef"></canvas>
    </div>

    <div class="h-40 mb-4">
      <canvas ref="tempCanvasRef"></canvas>
    </div>

    <div class="h-40">
      <canvas ref="contactCanvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useSimulationStore } from '~/composables/useSimulationStore';

Chart.register(...registerables);

const energyCanvasRef = ref<HTMLCanvasElement | null>(null);
const tempCanvasRef = ref<HTMLCanvasElement | null>(null);
const contactCanvasRef = ref<HTMLCanvasElement | null>(null);

let energyChart: Chart;
let tempChart: Chart;
let contactChart: Chart;

const store = useSimulationStore();

const createCharts = () => {
  if (!energyCanvasRef.value || !tempCanvasRef.value || !contactCanvasRef.value) return;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        labels: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
      }
    }
  };

  energyChart = new Chart(energyCanvasRef.value, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '能量 (E)',
        data: [],
        borderColor: '#1e88e5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        title: {
          display: true,
          text: '自由能变化',
          color: 'rgba(255, 255, 255, 0.8)',
          font: { family: 'Orbitron' }
        }
      }
    }
  });

  tempChart = new Chart(tempCanvasRef.value, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '温度 (T)',
        data: [],
        borderColor: '#ff7043',
        backgroundColor: 'rgba(255, 112, 67, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        title: {
          display: true,
          text: '模拟退火温度',
          color: 'rgba(255, 255, 255, 0.8)',
          font: { family: 'Orbitron' }
        }
      }
    }
  });

  contactChart = new Chart(contactCanvasRef.value, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: '天然接触数',
        data: [],
        borderColor: '#76ff03',
        backgroundColor: 'rgba(118, 255, 3, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      ...chartOptions,
      plugins: {
        ...chartOptions.plugins,
        title: {
          display: true,
          text: '疏水残基接触数',
          color: 'rgba(255, 255, 255, 0.8)',
          font: { family: 'Orbitron' }
        }
      }
    }
  });
};

const updateCharts = () => {
  if (!energyChart || !tempChart || !contactChart) return;

  const history = store.state.energyHistory.slice(-200);
  const labels = history.map((_, i) => i);
  const energies = history.map(h => h.energy);
  const temps = history.map(h => h.temperature);
  const contacts = history.map(h => h.nativeContacts);

  energyChart.data.labels = labels;
  energyChart.data.datasets[0].data = energies;
  energyChart.update('none');

  tempChart.data.labels = labels;
  tempChart.data.datasets[0].data = temps;
  tempChart.update('none');

  contactChart.data.labels = labels;
  contactChart.data.datasets[0].data = contacts;
  contactChart.update('none');
};

watch(
  () => store.state.energyHistory,
  () => updateCharts(),
  { deep: true }
);

onMounted(() => {
  createCharts();
});

onUnmounted(() => {
  energyChart?.destroy();
  tempChart?.destroy();
  contactChart?.destroy();
});
</script>
