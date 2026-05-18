<template>
  <div class="simulator-container">
    <div class="control-panel">
      <div class="panel-header">
        <h2>枝晶生长模拟器</h2>
        <p>Dendritic Growth Phase-Field</p>
      </div>

      <div class="control-section">
        <h3>模拟控制</h3>
        <div class="button-group">
          <button @click="toggleRunning" :class="{ active: isRunning }">
            {{ isRunning ? '暂停' : '开始' }}
          </button>
          <button @click="resetSimulation">重置</button>
          <button @click="stepOnce">单步</button>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span class="label">FPS:</span>
            <span class="value">{{ fps.toFixed(1) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">时间:</span>
            <span class="value">{{ simulationTime.toFixed(2) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">步数:</span>
            <span class="value">{{ frameCount }}</span>
          </div>
        </div>
      </div>

      <div class="control-section">
        <h3>预设场景</h3>
        <div class="preset-buttons">
          <button
            v-for="preset in PRESETS"
            :key="preset.id"
            @click="loadPreset(preset.id)"
            class="preset-btn"
          >
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-desc">{{ preset.description }}</span>
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>物理参数</h3>
        <div class="slider-group">
          <label>过冷度: {{ params.undercooling.toFixed(2) }}</label>
          <input
            v-model.number="params.undercooling"
            type="range"
            min="0.1"
            max="0.8"
            step="0.01"
          />
        </div>
        <div class="slider-group">
          <label>各向异性强度: {{ params.anisotropyStrength.toFixed(3) }}</label>
          <input
            v-model.number="params.anisotropyStrength"
            type="range"
            min="0"
            max="0.1"
            step="0.001"
          />
        </div>
        <div class="slider-group">
          <label>各向异性模式: {{ params.anisotropyMode.toFixed(0) }}</label>
          <input
            v-model.number="params.anisotropyMode"
            type="range"
            min="2"
            max="8"
            step="1"
          />
        </div>
        <div class="slider-group">
          <label>界面厚度: {{ params.interfaceThickness.toFixed(1) }}</label>
          <input
            v-model.number="params.interfaceThickness"
            type="range"
            min="1"
            max="10"
            step="0.5"
          />
        </div>
        <div class="slider-group">
          <label>噪声幅值: {{ params.noiseAmplitude.toFixed(4) }}</label>
          <input
            v-model.number="params.noiseAmplitude"
            type="range"
            min="0"
            max="0.05"
            step="0.001"
          />
        </div>
        <div class="slider-group">
          <label>迁移率: {{ params.mobility.toFixed(2) }}</label>
          <input
            v-model.number="params.mobility"
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
          />
        </div>
        <div class="slider-group">
          <label>时间步长: {{ params.timeStep.toFixed(3) }}</label>
          <input
            v-model.number="params.timeStep"
            type="range"
            min="0.001"
            max="0.1"
            step="0.001"
          />
        </div>
      </div>

      <div class="control-section">
        <h3>可视化模式</h3>
        <div class="visual-modes">
          <button
            v-for="(mode, idx) in visualModes"
            :key="idx"
            @click="visualMode = idx"
            :class="{ active: visualMode === idx }"
            class="mode-btn"
          >
            {{ mode }}
          </button>
        </div>
      </div>

      <div class="control-section" v-if="artifacts">
        <h3 class="artifact-header">数值Artifact检测</h3>
        <div class="artifact-list">
          <div
            v-if="artifacts.gridLocking"
            class="artifact-item warning"
          >
            ⚠️ 网格锁定: 枝晶生长方向被限制在坐标轴方向
          </div>
          <div
            v-if="artifacts.speedUnderestimation"
            class="artifact-item warning"
          >
            ⚠️ 速度低估: 界面厚度过大导致尖端速度偏低
          </div>
          <div
            v-if="artifacts.denseSidebranches"
            class="artifact-item warning"
          >
            ⚠️ 侧枝过密: 噪声幅值过高导致大量侧枝生长
          </div>
          <div
            v-if="artifacts.wavelengthFreezing"
            class="artifact-item warning"
          >
            ⚠️ 波长冻结: 深过冷导致失稳波长被网格解析不足
          </div>
        </div>
      </div>

      <div class="control-section">
        <h3>数据存储</h3>
        <div class="button-group">
          <button @click="saveCurrentState">保存状态</button>
          <button @click="exportScreenshot">导出截图</button>
        </div>
      </div>
    </div>

    <div class="canvas-container">
      <canvas
        ref="webglCanvas"
        :width="gridSize"
        :height="gridSize"
        class="simulation-canvas"
      ></canvas>
      <canvas
        ref="overlayCanvas"
        :width="gridSize"
        :height="gridSize"
        class="overlay-canvas"
      ></canvas>
      
      <div class="color-bar">
        <div class="bar-title">{{ colorBarTitle }}</div>
        <div class="bar-gradient" :style="{ background: colorBarGradient }"></div>
        <div class="bar-labels">
          <span>0.0</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { useWebGL } from '../composables/useWebGL'
import { useIndexedDB } from '../composables/useIndexedDB'
import { PRESETS, DEFAULT_PRESET } from '../utils/presets'
import { marchingSquares, findGrowthTips, detectNumericalArtifacts } from '../utils/marchingSquares'
import type { SimulationParams } from '../types/simulation'

const gridSize = 512
const webglCanvas = ref<HTMLCanvasElement | null>(null)
const overlayCanvas = ref<HTMLCanvasElement | null>(null)

const { init, initializeFields, stepSimulation, render, readPhaseField, readConcentrationField, isInitialized } = useWebGL()
const { initDB, saveState } = useIndexedDB()

const isRunning = ref(false)
const simulationTime = ref(0)
const frameCount = ref(0)
const fps = ref(60)
const visualMode = ref(0)
const lastFrameTime = ref(performance.now())

const visualModes = ['相场', '溶质浓度', '晶格取向', '曲率']

const params = reactive<SimulationParams>({
  ...DEFAULT_PRESET.params,
  nuclei: [...DEFAULT_PRESET.params.nuclei]
})

const artifacts = ref<{
  gridLocking: boolean
  speedUnderestimation: boolean
  denseSidebranches: boolean
  wavelengthFreezing: boolean
} | null>(null)

let animationId: number | null = null
let prevPhaseData: Float32Array | null = null
const cachedPhaseData = new Float32Array(gridSize * gridSize)
let dataReadCounter = 0

const colorBarTitle = computed(() => visualModes[visualMode.value])

const colorBarGradient = computed(() => {
  switch (visualMode.value) {
    case 0:
      return 'linear-gradient(to top, #0a1628 0%, #1a3a5c 50%, #e6d5a8 100%)'
    case 1:
      return 'linear-gradient(to top, #1a3a5c 0%, #2d8f6f 50%, #e64c3c 100%)'
    case 2:
      return 'linear-gradient(to top, #ff0000 0%, #ffff00 25%, #00ff00 50%, #00ffff 75%, #0000ff 100%)'
    case 3:
      return 'linear-gradient(to top, #2d5fff 0%, #ffffff 50%, #ff4444 100%)'
    default:
      return 'linear-gradient(to top, #0a1628 0%, #e6d5a8 100%)'
  }
})

function loadPreset(presetId: string) {
  const preset = PRESETS[presetId]
  if (preset) {
    Object.assign(params, preset.params)
    params.nuclei = [...preset.params.nuclei]
    resetSimulation()
  }
}

function toggleRunning() {
  isRunning.value = !isRunning.value
  if (isRunning.value) {
    if (animationId === null) {
      lastFrameTime.value = performance.now()
      runSimulation()
    }
  } else {
    stopSimulation()
  }
}

function stopSimulation() {
  isRunning.value = false
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function resetSimulation() {
  stopSimulation()
  simulationTime.value = 0
  frameCount.value = 0
  prevPhaseData = null
  artifacts.value = null
  dataReadCounter = 0
  
  if (isInitialized.value) {
    initializeFields(params)
    render(visualMode.value, 0)
    drawOverlay(true)
  }
}

function stepOnce() {
  if (!isInitialized.value) return
  
  simulationTime.value += params.timeStep
  frameCount.value++
  stepSimulation(params, simulationTime.value)
  render(visualMode.value, simulationTime.value)
  drawOverlay(true)
  updateArtifacts()
}

function runSimulation() {
  if (!isInitialized.value || !isRunning.value) {
    animationId = null
    return
  }

  const now = performance.now()
  const delta = now - lastFrameTime.value
  fps.value = 1000 / delta
  lastFrameTime.value = now

  simulationTime.value += params.timeStep
  frameCount.value++
  
  stepSimulation(params, simulationTime.value)
  render(visualMode.value, simulationTime.value)
  drawOverlay()

  if (frameCount.value % 60 === 0) {
    updateArtifacts()
  }

  animationId = requestAnimationFrame(runSimulation)
}

function drawOverlay(forceRead: boolean = false) {
  const canvas = overlayCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, gridSize, gridSize)
  
  dataReadCounter++
  const shouldReadData = forceRead || dataReadCounter >= 3
  
  const downsample = 4
  
  if (shouldReadData) {
    dataReadCounter = 0
    const phaseDataRaw = readPhaseField()
    for (let i = 0; i < gridSize * gridSize; i++) {
      cachedPhaseData[i] = phaseDataRaw[i * 4]
    }
  }

  const contours = marchingSquares(cachedPhaseData, gridSize, gridSize, 0.5, downsample)
  
  ctx.strokeStyle = `rgba(0, 255, 200, ${0.5 + 0.3 * Math.sin(simulationTime.value * 5)})`
  ctx.lineWidth = 1.5
  ctx.shadowColor = 'rgba(0, 255, 200, 0.8)'
  ctx.shadowBlur = 4

  for (const contour of contours) {
    if (contour.length < 2) continue
    
    ctx.beginPath()
    ctx.moveTo(contour[0][0] * downsample, contour[0][1] * downsample)
    for (let i = 1; i < contour.length; i++) {
      ctx.lineTo(contour[i][0] * downsample, contour[i][1] * downsample)
    }
    ctx.stroke()
  }

  ctx.shadowBlur = 0

  if (shouldReadData) {
    const tips = findGrowthTips(cachedPhaseData, gridSize, gridSize, prevPhaseData, downsample)
    prevPhaseData = new Float32Array(cachedPhaseData)

    for (const tip of tips) {
      const angle = Math.atan2(tip.vy, tip.vx)
      const arrowLen = 10 + tip.speed * 5

      ctx.save()
      ctx.translate(tip.x * downsample, tip.y * downsample)
      ctx.rotate(angle)

      const hue = (angle + Math.PI) / (2 * Math.PI) * 360
      ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`
      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(-arrowLen * 0.5, 0)
      ctx.lineTo(arrowLen * 0.5, 0)
      ctx.lineTo(arrowLen * 0.3, -4)
      ctx.moveTo(arrowLen * 0.5, 0)
      ctx.lineTo(arrowLen * 0.3, 4)
      ctx.stroke()

      ctx.restore()
    }
  }

  if (artifacts.value && artifacts.value.gridLocking) {
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    
    for (let i = 0; i <= 8; i++) {
      const pos = i * gridSize / 8
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, gridSize)
      ctx.moveTo(0, pos)
      ctx.lineTo(gridSize, pos)
      ctx.stroke()
    }
    
    ctx.setLineDash([])
  }
}

function updateArtifacts() {
  const phaseDataRaw = readPhaseField()
  const phaseData = new Float32Array(gridSize * gridSize)
  for (let i = 0; i < gridSize * gridSize; i++) {
    phaseData[i] = phaseDataRaw[i * 4]
  }
  
  artifacts.value = detectNumericalArtifacts(phaseData, gridSize, gridSize, params)
}

async function saveCurrentState() {
  const phaseDataRaw = readPhaseField()
  const concentrationDataRaw = readConcentrationField()

  const phaseData: number[] = []
  const concentrationData: number[] = []

  for (let i = 0; i < gridSize * gridSize; i++) {
    phaseData.push(phaseDataRaw[i * 4])
    concentrationData.push(concentrationDataRaw[i * 4])
  }

  await saveState({
    name: `Simulation ${new Date().toLocaleTimeString()}`,
    params: { ...params, nuclei: params.nuclei.map(n => ({ ...n })) },
    frameNumber: frameCount.value,
    simulationTime: simulationTime.value,
    phaseField: phaseData,
    concentrationField: concentrationData
  })
}

function exportScreenshot() {
  const canvas = webglCanvas.value
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `dendritic-simulation-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

watch(visualMode, () => {
  if (isInitialized.value) {
    render(visualMode.value, simulationTime.value)
    drawOverlay(true)
  }
})

onMounted(async () => {
  await initDB()
  
  if (webglCanvas.value) {
    const success = init(webglCanvas.value, gridSize, gridSize)
    if (success) {
      initializeFields(params)
      render(visualMode.value, 0)
      drawOverlay()
    }
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.simulator-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%);
  color: #fff;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.control-panel {
  width: 320px;
  padding: 20px;
  background: rgba(15, 30, 50, 0.95);
  border-right: 1px solid rgba(100, 150, 255, 0.2);
  overflow-y: auto;
  flex-shrink: 0;
}

.panel-header {
  text-align: center;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.3);
}

.panel-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  background: linear-gradient(90deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.panel-header p {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
}

.control-section {
  margin-bottom: 24px;
}

.control-section h3 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  color: #00d4ff;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  padding: 10px 16px;
  border: 1px solid rgba(100, 150, 255, 0.3);
  background: rgba(100, 150, 255, 0.1);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

button:hover {
  background: rgba(100, 150, 255, 0.2);
  border-color: rgba(100, 150, 255, 0.5);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

button.active {
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  color: #0a1628;
  border-color: transparent;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.stat-item {
  padding: 8px;
  background: rgba(100, 150, 255, 0.1);
  border-radius: 6px;
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #00d4ff;
  font-family: 'JetBrains Mono', monospace;
}

.preset-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-btn {
  padding: 12px 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-name {
  font-weight: 600;
  font-size: 0.85rem;
}

.preset-desc {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.slider-group {
  margin-bottom: 12px;
}

.slider-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.slider-group input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(100, 150, 255, 0.2);
  border-radius: 3px;
  outline: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.visual-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mode-btn {
  padding: 10px 8px;
  font-size: 0.8rem;
}

.artifact-header {
  color: #ff6b6b;
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artifact-item {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.4;
}

.artifact-item.warning {
  background: rgba(255, 107, 107, 0.15);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff8a8a;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
}

.simulation-canvas,
.overlay-canvas {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.2);
}

.overlay-canvas {
  pointer-events: none;
}

.color-bar {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  padding: 10px;
  background: rgba(15, 30, 50, 0.9);
  border-radius: 8px;
  border: 1px solid rgba(100, 150, 255, 0.2);
}

.bar-title {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 8px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.bar-gradient {
  width: 20px;
  height: 200px;
  margin: 0 auto;
  border-radius: 4px;
}

.bar-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 200px;
  margin-top: -200px;
  padding: 0 0 0 25px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'JetBrains Mono', monospace;
}

.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(100, 150, 255, 0.3);
  border-radius: 3px;
}
</style>
