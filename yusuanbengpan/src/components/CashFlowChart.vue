<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3 class="section-title">12个月现金流模拟</h3>
      <div class="chart-legend">
        <span class="legend-item">
          <span class="legend-color savings-color"></span>
          存款余额
        </span>
        <span class="legend-item">
          <span class="legend-color threshold-color"></span>
          警戒线
        </span>
      </div>
    </div>
    
    <div class="chart-wrapper">
      <div v-if="chartData.length === 0" class="chart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style="opacity: 0.3;">
          <path d="M3 3v18h18M3 17l4-4 3 3L16 9l5 5" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>点击「开始模拟」查看现金流变化趋势</p>
      </div>
      
      <div v-else class="chart-svg-container">
        <svg :width="chartWidth" :height="chartHeight" class="cash-flow-chart">
          <defs>
            <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :style="`stop-color: ${savingsColor}; stop-opacity: 0.3`"/>
              <stop offset="100%" :style="`stop-color: ${savingsColor}; stop-opacity: 0`"/>
            </linearGradient>
            <linearGradient id="warningGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :style="`stop-color: ${warningColor}; stop-opacity: 0.3`"/>
              <stop offset="100%" :style="`stop-color: ${warningColor}; stop-opacity: 0`"/>
            </linearGradient>
          </defs>
          
          <g class="grid-lines">
            <line 
              v-for="i in 5" 
              :key="`h-line-${i}`"
              :x1="padding.left" 
              :y1="padding.top + (chartHeight - padding.top - padding.bottom) * i / 5"
              :x2="chartWidth - padding.right" 
              :y2="padding.top + (chartHeight - padding.top - padding.bottom) * i / 5"
              class="grid-line"
            />
          </g>
          
          <line 
            :x1="padding.left" 
            :y1="thresholdY"
            :x2="chartWidth - padding.right" 
            :y2="thresholdY"
            class="threshold-line"
            :stroke="warningColor"
            stroke-dasharray="8,4"
          />
          
          <Transition name="fade">
            <g v-if="animatedPath" class="area-fill">
              <path 
                :d="areaPath"
                fill="url(#savingsGradient)"
              />
            </g>
          </Transition>
          
          <Transition name="fade">
            <g v-if="animatedPath" class="chart-line">
              <path 
                :d="animatedPath"
                :stroke="savingsColor"
                stroke-width="3"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                :style="lineAnimationStyle"
              />
            </g>
          </Transition>
          
          <TransitionGroup name="point">
            <g 
              v-for="(point, index) in animatedPoints" 
              :key="index"
              class="data-point"
              :class="{ 
                'warning-point': point.belowThreshold,
                'current-point': index === currentMonthIndex
              }"
            >
              <circle 
                :cx="point.x" 
                :cy="point.y" 
                :r="point.belowThreshold ? 8 : 6"
                :fill="point.belowThreshold ? warningColor : savingsColor"
                :stroke="point.belowThreshold ? warningColor : savingsColor"
                stroke-width="2"
              />
              <circle 
                v-if="index === currentMonthIndex"
                :cx="point.x" 
                :cy="point.y" 
                :r="12"
                fill="none"
                :stroke="point.belowThreshold ? warningColor : savingsColor"
                stroke-width="2"
                class="pulse-ring"
              />
            </g>
          </TransitionGroup>
          
          <g class="x-axis">
            <text 
              v-for="(point, index) in chartData" 
              :key="`x-label-${index}`"
              :x="getX(index)"
              :y="chartHeight - 10"
              class="axis-label"
              text-anchor="middle"
            >
              {{ point.monthName }}
            </text>
          </g>
          
          <g class="y-axis">
            <text 
              v-for="i in 6" 
              :key="`y-label-${i}`"
              :x="padding.left - 10"
              :y="chartHeight - padding.bottom - (chartHeight - padding.top - padding.bottom) * (i - 1) / 5"
              class="axis-label"
              text-anchor="end"
            >
              {{ formatNumber(yMin + (yMax - yMin) * (i - 1) / 5) }}
            </text>
          </g>
        </svg>
        
        <div class="tooltip-container" ref="tooltipRef">
          <Transition name="tooltip">
            <div 
              v-if="hoveredPoint !== null && tooltipData" 
              class="chart-tooltip"
              :style="{ left: tooltipData.left + 'px', top: tooltipData.top + 'px' }"
            >
              <div class="tooltip-title">{{ tooltipData.monthName }}</div>
              <div class="tooltip-content">
                <div class="tooltip-row">
                  <span class="tooltip-label">存款余额:</span>
                  <span class="tooltip-value" :class="{ 'warning': tooltipData.belowThreshold }">
                    ¥{{ formatNumber(tooltipData.endSavings) }}
                  </span>
                </div>
                <div class="tooltip-row">
                  <span class="tooltip-label">净流入:</span>
                  <span class="tooltip-value" :class="{ 'positive': tooltipData.netCashFlow >= 0, 'negative': tooltipData.netCashFlow < 0 }">
                    {{ tooltipData.netCashFlow >= 0 ? '+' : '' }}¥{{ formatNumber(tooltipData.netCashFlow) }}
                  </span>
                </div>
                <div v-if="tooltipData.emergencyOccurred" class="tooltip-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  突发事件发生
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    
    <div class="chart-stats">
      <div class="stat-item">
        <span class="stat-label">最终存款:</span>
        <span class="stat-value" :class="{ 'warning': finalSavings < warningThreshold }">
          ¥{{ formatNumber(finalSavings) }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最低存款:</span>
        <span class="stat-value" :class="{ 'warning': minSavings < warningThreshold }">
          ¥{{ formatNumber(minSavings) }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">跌破警戒线月份:</span>
        <span class="stat-value danger" v-if="warningMonths > 0">{{ warningMonths }} 个月</span>
        <span class="stat-value safe" v-else>安全</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  chartData: {
    type: Array,
    required: true
  },
  warningThreshold: {
    type: Number,
    required: true
  },
  currentMonthIndex: {
    type: Number,
    default: -1
  },
  isSimulating: {
    type: Boolean,
    default: false
  }
})

const chartWidth = ref(800)
const chartHeight = ref(400)
const hoveredPoint = ref(null)
const tooltipData = ref(null)
const tooltipRef = ref(null)
const animationProgress = ref(0)
let animationFrame = null

const padding = {
  top: 40,
  right: 40,
  bottom: 50,
  left: 100
}

const savingsColor = '#6366f1'
const warningColor = '#ef4444'

const allValues = computed(() => {
  const values = props.chartData.map(d => [d.startSavings, d.endSavings]).flat()
  values.push(props.warningThreshold)
  return values
})

const yMin = computed(() => {
  const min = Math.min(...allValues.value, 0)
  return Math.floor(min / 1000) * 1000 - 1000
})

const yMax = computed(() => {
  const max = Math.max(...allValues.value)
  return Math.ceil(max / 1000) * 1000 + 1000
})

const thresholdY = computed(() => {
  const range = yMax.value - yMin.value
  const normalized = (props.warningThreshold - yMin.value) / range
  return chartHeight.value - padding.bottom - normalized * (chartHeight.value - padding.top - padding.bottom)
})

const getX = (index) => {
  const dataLength = props.chartData.length || 12
  return padding.left + (chartWidth.value - padding.left - padding.right) * index / (dataLength - 1 || 1)
}

const getY = (value) => {
  const range = yMax.value - yMin.value
  const normalized = (value - yMin.value) / range
  return chartHeight.value - padding.bottom - normalized * (chartHeight.value - padding.top - padding.bottom)
}

const displayData = computed(() => {
  if (props.currentMonthIndex === -1) return []
  return props.chartData.slice(0, props.currentMonthIndex + 1)
})

const linePath = computed(() => {
  if (displayData.value.length < 2) return ''
  
  let path = `M ${getX(0)} ${getY(displayData.value[0].endSavings)}`
  
  for (let i = 1; i < displayData.value.length; i++) {
    const prevX = getX(i - 1)
    const prevY = getY(displayData.value[i - 1].endSavings)
    const currX = getX(i)
    const currY = getY(displayData.value[i].endSavings)
    
    const cpX = (prevX + currX) / 2
    path += ` C ${cpX} ${prevY}, ${cpX} ${currY}, ${currX} ${currY}`
  }
  
  return path
})

const areaPath = computed(() => {
  if (displayData.value.length < 2) return ''
  
  const baseY = getY(0)
  let path = `M ${getX(0)} ${baseY}`
  
  path += ` L ${getX(0)} ${getY(displayData.value[0].endSavings)}`
  
  for (let i = 1; i < displayData.value.length; i++) {
    const prevX = getX(i - 1)
    const prevY = getY(displayData.value[i - 1].endSavings)
    const currX = getX(i)
    const currY = getY(displayData.value[i].endSavings)
    
    const cpX = (prevX + currX) / 2
    path += ` C ${cpX} ${prevY}, ${cpX} ${currY}, ${currX} ${currY}`
  }
  
  path += ` L ${getX(displayData.value.length - 1)} ${baseY}`
  path += ' Z'
  
  return path
})

const animatedPath = computed(() => linePath.value)

const animatedPoints = computed(() => {
  return displayData.value.map((data, index) => ({
    x: getX(index),
    y: getY(data.endSavings),
    belowThreshold: data.belowThreshold,
    data
  }))
})

const lineAnimationStyle = computed(() => {
  return {
    transition: 'all 0.3s ease-out'
  }
})

const finalSavings = computed(() => {
  if (props.chartData.length === 0) return 0
  return props.chartData[props.chartData.length - 1].endSavings
})

const minSavings = computed(() => {
  if (props.chartData.length === 0) return 0
  return Math.min(...props.chartData.map(d => d.endSavings))
})

const warningMonths = computed(() => {
  return props.chartData.filter(d => d.belowThreshold).length
})

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const handleResize = () => {
  if (tooltipRef.value && tooltipRef.value.parentElement) {
    const rect = tooltipRef.value.parentElement.getBoundingClientRect()
    chartWidth.value = Math.min(rect.width, 800)
    chartHeight.value = Math.min(400, chartWidth.value * 0.5)
  }
}

watch(() => props.chartData, () => {
  if (props.chartData.length > 0) {
    animationProgress.value = 0
  }
}, { deep: true })

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.chart-container {
  padding: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h, #333);
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text, #666);
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.savings-color {
  background: #6366f1;
}

.threshold-color {
  background: #ef4444;
}

.chart-wrapper {
  background: var(--card-bg, #f9f9f9);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border, #e0e0e0);
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text, #666);
  text-align: center;
}

.chart-empty p {
  margin-top: 16px;
  font-size: 14px;
}

.chart-svg-container {
  position: relative;
  width: 100%;
  overflow: visible;
}

.cash-flow-chart {
  width: 100%;
  height: auto;
}

.grid-line {
  stroke: var(--border, #e0e0e0);
  stroke-width: 1;
}

.threshold-line {
  stroke-width: 2;
}

.area-fill {
  transition: all 0.5s ease;
}

.chart-line {
  filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
}

.data-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-point:hover circle {
  transform: scale(1.3);
}

.current-point circle {
  animation: pulse 1.5s ease-in-out infinite;
}

.pulse-ring {
  animation: ringPulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes ringPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.axis-label {
  font-size: 12px;
  fill: var(--text, #666);
}

.tooltip-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.chart-tooltip {
  position: absolute;
  background: var(--bg, #fff);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border, #e0e0e0);
  z-index: 100;
  pointer-events: none;
  transform: translate(-50%, -120%);
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h, #333);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border, #e0e0e0);
}

.tooltip-content {
  font-size: 13px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
}

.tooltip-label {
  color: var(--text, #666);
}

.tooltip-value {
  font-weight: 600;
  color: var(--text-h, #333);
}

.tooltip-value.warning {
  color: #ef4444;
}

.tooltip-value.positive {
  color: #10b981;
}

.tooltip-value.negative {
  color: #ef4444;
}

.tooltip-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 6px 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--card-bg, #f9f9f9);
  border-radius: 8px;
  border: 1px solid var(--border, #e0e0e0);
}

.stat-label {
  font-size: 13px;
  color: var(--text, #666);
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-h, #333);
}

.stat-value.warning {
  color: #ef4444;
  animation: flash 1s ease-in-out infinite;
}

.stat-value.danger {
  color: #ef4444;
}

.stat-value.safe {
  color: #10b981;
}

@keyframes flash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.point-enter-active {
  transition: all 0.3s ease-out;
}

.point-enter-from {
  opacity: 0;
  transform: scale(0);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, -130%);
}
</style>
