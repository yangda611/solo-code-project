<template>
  <div class="visualization-container">
    <h3>📈 趋势分析</h3>
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { useSimulation } from '../composables/useSimulation'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { history, stats, isRunning } = useSimulation()

const maxDataPoints = 100

const chartData = computed(() => {
  const historyData = history.value.length > maxDataPoints
    ? history.value.slice(-maxDataPoints)
    : history.value

  return {
    labels: historyData.map((_, i) => i + 1),
    datasets: [
      {
        label: '易感人群',
        data: historyData.map(h => h.susceptible),
        borderColor: '#9E9E9E',
        backgroundColor: 'rgba(158, 158, 158, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: '感染者',
        data: historyData.map(h => h.infected),
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: '康复者',
        data: historyData.map(h => h.recovered),
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      },
      {
        label: '隔离者',
        data: historyData.map(h => h.isolated),
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 14
      },
      bodyFont: {
        size: 13
      },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(200, 200, 200, 0.3)'
      },
      ticks: {
        maxTicksLimit: 10,
        color: '#666'
      },
      title: {
        display: true,
        text: '时间步',
        color: '#666'
      }
    },
    y: {
      stacked: false,
      grid: {
        display: true,
        color: 'rgba(200, 200, 200, 0.3)'
      },
      ticks: {
        color: '#666'
      },
      title: {
        display: true,
        text: '人数',
        color: '#666'
      },
      beginAtZero: true
    }
  },
  animation: {
    duration: 300,
    easing: 'linear'
  },
  elements: {
    line: {
      tension: 0.4
    }
  }
}))
</script>
