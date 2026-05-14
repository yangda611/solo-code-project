<template>
  <div id="app">
    <header class="app-header">
      <h1>🧵 机织物细观结构力学响应分析系统</h1>
      <div class="status-item">
        当前模式: <span>{{ loadTypeLabel }}</span>
      </div>
    </header>

    <div class="app-content">
      <aside class="sidebar">
        <div class="sidebar-section">
          <h3>📋 预设场景</h3>
          <div class="preset-buttons">
            <button class="preset-btn" @click="loadPreset('平纹布拉伸预设')">
              平纹布<br/>拉伸
            </button>
            <button class="preset-btn" @click="loadPreset('斜纹布剪切预设')">
              斜纹布<br/>剪切
            </button>
            <button class="preset-btn" @click="loadPreset('缎纹布顶破预设')">
              缎纹布<br/>顶破
            </button>
            <button class="preset-btn" @click="loadPreset('多层复合弯曲预设')">
              多层复合<br/>弯曲
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>⚙️ 织物参数</h3>
          <div class="control-group">
            <label>
              经纱密度
              <span class="value-display">{{ warpDensity }} 根/cm</span>
            </label>
            <input type="range" v-model="warpDensity" min="10" max="50" step="1" @input="updateFabric">
          </div>
          <div class="control-group">
            <label>
              纬纱捻度
              <span class="value-display">{{ weftTwist }} 捻/m</span>
            </label>
            <input type="range" v-model="weftTwist" min="100" max="800" step="10" @input="updateFabric">
          </div>
          <div class="control-group">
            <label>交织规律</label>
            <select v-model="weavePattern" @change="updateFabric">
              <option value="plain">平纹组织</option>
              <option value="twill">斜纹组织</option>
              <option value="satin">缎纹组织</option>
              <option value="multi_layer">多层复合</option>
            </select>
          </div>
          <div class="control-group">
            <label>
              织物层数
              <span class="value-display">{{ layers }} 层</span>
            </label>
            <input type="range" v-model="layers" min="1" max="5" step="1" @input="updateFabric">
          </div>
        </div>

        <div class="sidebar-section">
          <h3>💪 加载控制</h3>
          <div class="control-group">
            <label>载荷类型</label>
            <select v-model="loadType">
              <option value="tensile">面内拉伸</option>
              <option value="shear">面内剪切</option>
              <option value="bending">面外弯曲</option>
              <option value="bursting">顶破</option>
            </select>
          </div>
          <div class="control-group">
            <label>
              最大位移
              <span class="value-display">{{ maxDisplacement }} mm</span>
            </label>
            <input type="range" v-model="maxDisplacement" min="10" max="100" step="5">
          </div>
          <div class="load-controls">
            <button class="action-btn primary" @click="startSimulation">
              {{ isSimulating ? '停止模拟' : '开始模拟' }}
            </button>
            <button class="action-btn secondary" @click="resetSimulation">
              重置
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <h3>🎬 动画效果</h3>
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showEllipseAnim"> 纱线截面椭圆化
            </label>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showFrictionSparks"> 交织点摩擦火花
            </label>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showWrinkleWaves"> 表面起皱波纹扩散
            </label>
          </div>
          <div class="control-group">
            <label>
              <input type="checkbox" v-model="showBreakParticles"> 纱线断裂粒子飞散
            </label>
          </div>
        </div>
      </aside>

      <main class="main-view">
        <div class="canvas-container">
          <canvas id="babylon-canvas"></canvas>
          <div class="legend-panel">
            <div class="legend-item">
              <div class="legend-color" style="background: #e94560;"></div>
              <span>经纱 (Warp)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #45b7e9;"></div>
              <span>纬纱 (Weft)</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #ffaa00;"></div>
              <span>高应力区</span>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background: #00ff88;"></div>
              <span>层间滑移</span>
            </div>
          </div>
        </div>

        <div class="chart-panel">
          <div class="chart-container">
            <h4>📊 应力-应变曲线</h4>
            <canvas ref="stressStrainChart"></canvas>
          </div>
          <div class="chart-container">
            <h4>📈 接触力-位移曲线</h4>
            <canvas ref="contactForceChart"></canvas>
          </div>
        </div>
      </main>
    </div>

    <div class="status-bar">
      <div class="status-item">接触力: <span>{{ currentContactForce.toFixed(2) }} N</span></div>
      <div class="status-item">应力集中系数: <span>{{ stressConcentration.toFixed(2) }}</span></div>
      <div class="status-item">泊松比: <span>{{ poissonsRatio.toFixed(3) }}</span></div>
      <div class="status-item">层间滑移: <span>{{ interlayerSlip.toFixed(3) }} mm</span></div>
      <div class="status-item">屈曲振幅: <span>{{ buckleAmplitude.toFixed(3) }} mm</span></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  Color4,
  ParticleSystem,
  Texture
} from '@babylonjs/core'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const warpDensity = ref(20)
const weftTwist = ref(300)
const weavePattern = ref('plain')
const layers = ref(1)
const loadType = ref('tensile')
const maxDisplacement = ref(50)
const isSimulating = ref(false)

const showEllipseAnim = ref(true)
const showFrictionSparks = ref(true)
const showWrinkleWaves = ref(true)
const showBreakParticles = ref(true)

const currentContactForce = ref(0)
const stressConcentration = ref(1)
const poissonsRatio = ref(0.3)
const interlayerSlip = ref(0)
const buckleAmplitude = ref(0)

const stressStrainChart = ref(null)
const contactForceChart = ref(null)

let engine = null
let scene = null
let warpYarns = []
let weftYarns = []
let frictionParticles = []
let breakParticles = []
let stressChartInstance = null
let forceChartInstance = null
let simulationProgress = 0
let simulationData = null
let resizeHandler = null

const loadTypeLabels = {
  tensile: '面内拉伸',
  shear: '面内剪切',
  bending: '面外弯曲',
  bursting: '顶破'
}

const loadTypeLabel = ref('面内拉伸')

function createParticleTexture(scene) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)')
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 16, 16)
    return new Texture(canvas.toDataURL(), scene)
  } catch (e) {
    console.warn('创建粒子纹理失败:', e)
    return null
  }
}

function initBabylon() {
  try {
    const canvas = document.getElementById('babylon-canvas')
    if (!canvas) {
      console.error('找不到 canvas 元素')
      return
    }

    engine = new Engine(canvas, true)
    scene = new Scene(engine)
    scene.clearColor = new Color4(0.08, 0.1, 0.18, 1)

    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 3,
      Math.PI / 3,
      25,
      new Vector3(0, 2, 0),
      scene
    )
    camera.attachControl(canvas, true)
    camera.lowerRadiusLimit = 10
    camera.upperRadiusLimit = 50

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
    light.intensity = 0.7
    light.diffuse = new Color3(1, 1, 1)
    light.groundColor = new Color3(0.2, 0.2, 0.3)

    createGround()
    createFabric()
    createParticles()

    engine.runRenderLoop(() => {
      try {
        scene.render()
        updateAnimations()
      } catch (e) {
        console.error('渲染循环错误:', e)
      }
    })

    resizeHandler = () => {
      if (engine) engine.resize()
    }
    window.addEventListener('resize', resizeHandler)

    console.log('Babylon.js 初始化成功')
  } catch (e) {
    console.error('Babylon.js 初始化失败:', e)
  }
}

function createGround() {
  try {
    const ground = MeshBuilder.CreateGround('ground', { width: 30, height: 30 }, scene)
    const groundMat = new StandardMaterial('groundMat', scene)
    groundMat.diffuseColor = new Color3(0.1, 0.12, 0.2)
    groundMat.specularColor = new Color3(0.1, 0.1, 0.1)
    ground.material = groundMat
    ground.position.y = -2
  } catch (e) {
    console.error('创建地面失败:', e)
  }
}

function createFabric() {
  try {
    warpYarns.forEach(y => y.dispose && y.dispose())
    weftYarns.forEach(y => y.dispose && y.dispose())
    warpYarns = []
    weftYarns = []

    const numWarps = Math.floor(warpDensity.value / 2)
    const numWefts = Math.floor(warpDensity.value / 2)
    const spacing = 1.2

    const warpMat = new StandardMaterial('warpMat', scene)
    warpMat.diffuseColor = new Color3(0.91, 0.27, 0.38)
    warpMat.specularColor = new Color3(0.3, 0.1, 0.1)

    const weftMat = new StandardMaterial('weftMat', scene)
    weftMat.diffuseColor = new Color3(0.27, 0.72, 0.91)
    weftMat.specularColor = new Color3(0.1, 0.2, 0.3)

    for (let layer = 0; layer < layers.value; layer++) {
      const layerOffset = layer * 0.8

      for (let i = 0; i < numWarps; i++) {
        const x = (i - numWarps / 2) * spacing
        const points = []
        for (let j = 0; j <= 40; j++) {
          const z = (j / 40 - 0.5) * numWefts * spacing
          let y = layerOffset
          if (weavePattern.value === 'plain') {
            y += Math.sin(j * 0.5 + i * 0.5) * 0.15
          } else if (weavePattern.value === 'twill') {
            y += Math.sin(j * 0.3 + i * 0.7) * 0.2
          } else if (weavePattern.value === 'satin') {
            y += Math.sin(j * 0.2 + i * 0.3) * 0.25
          } else {
            y += Math.sin(j * 0.4 + i * 0.6 + layer) * 0.18
          }
          points.push(new Vector3(x, y, z))
        }
        const yarn = MeshBuilder.CreateTube(`warp_${layer}_${i}`, {
          path: points,
          radius: 0.08 + weftTwist.value * 0.0001,
          tessellation: 12
        }, scene)
        yarn.material = warpMat
        warpYarns.push(yarn)
      }

      for (let j = 0; j < numWefts; j++) {
        const z = (j - numWefts / 2) * spacing
        const points = []
        for (let i = 0; i <= 40; i++) {
          const x = (i / 40 - 0.5) * numWarps * spacing
          let y = layerOffset
          if (weavePattern.value === 'plain') {
            y += -Math.sin(i * 0.5 + j * 0.5) * 0.15
          } else if (weavePattern.value === 'twill') {
            y += -Math.sin(i * 0.3 + j * 0.7) * 0.2
          } else if (weavePattern.value === 'satin') {
            y += -Math.sin(i * 0.2 + j * 0.3) * 0.25
          } else {
            y += -Math.sin(i * 0.4 + j * 0.6 + layer) * 0.18
          }
          points.push(new Vector3(x, y, z))
        }
        const yarn = MeshBuilder.CreateTube(`weft_${layer}_${j}`, {
          path: points,
          radius: 0.09 + weftTwist.value * 0.0001,
          tessellation: 12
        }, scene)
        yarn.material = weftMat
        weftYarns.push(yarn)
      }
    }
    console.log('织物创建成功，经纱数:', warpYarns.length, '纬纱数:', weftYarns.length)
  } catch (e) {
    console.error('创建织物失败:', e)
  }
}

function createParticles() {
  try {
    const particleTexture = createParticleTexture(scene)
    
    for (let i = 0; i < 5; i++) {
      const particleSystem = new ParticleSystem('friction', 50, scene)
      if (particleTexture) {
        particleSystem.particleTexture = particleTexture
      }
      particleSystem.emitter = new Vector3(0, 0, 0)
      particleSystem.minEmitBox = new Vector3(-0.1, -0.1, -0.1)
      particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0.1)
      particleSystem.color1 = new Color4(1, 0.7, 0, 1)
      particleSystem.color2 = new Color4(1, 0.3, 0, 1)
      particleSystem.minSize = 0.05
      particleSystem.maxSize = 0.15
      particleSystem.minLifeTime = 0.2
      particleSystem.maxLifeTime = 0.5
      particleSystem.emitRate = 100
      particleSystem.direction1 = new Vector3(-0.5, 1, -0.5)
      particleSystem.direction2 = new Vector3(0.5, 2, 0.5)
      particleSystem.stop()
      frictionParticles.push(particleSystem)
    }
    console.log('摩擦粒子系统创建成功')
  } catch (e) {
    console.error('创建粒子系统失败:', e)
  }
}

function updateAnimations() {
  if (!isSimulating.value) return

  try {
    simulationProgress += 0.005
    if (simulationProgress > 1) simulationProgress = 0

    const currentStep = Math.floor(simulationProgress * 50)
    if (simulationData) {
      currentContactForce.value = simulationData.contactForces[currentStep]?.force || 0
      stressConcentration.value = simulationData.stressConcentrations[currentStep]?.factor || 1
      poissonsRatio.value = simulationData.poissonsRatios[currentStep]?.ratio || 0.3
      interlayerSlip.value = simulationData.interlayerSlips[currentStep]?.slip || 0
      buckleAmplitude.value = simulationData.buckleAmplitudes[currentStep]?.amplitude || 0

      updateCharts(currentStep)
    }

    if (showEllipseAnim.value && warpYarns.length > 0) {
      const scale = 1 + Math.sin(simulationProgress * Math.PI * 4) * 0.3
      warpYarns.forEach((yarn, i) => {
        if (yarn.scaling) {
          yarn.scaling.y = 1 + scale * Math.sin(i * 0.5 + simulationProgress * 10) * 0.2
          yarn.scaling.x = 1 / yarn.scaling.y
        }
      })
    }

    if (showFrictionSparks.value && simulationProgress > 0.3 && frictionParticles.length > 0) {
      const numActive = Math.min(frictionParticles.length, Math.floor(simulationProgress * 10))
      for (let i = 0; i < numActive; i++) {
        const idx = Math.floor(i + simulationProgress * 20) % frictionParticles.length
        if (frictionParticles[idx]) {
          frictionParticles[idx].emitter = new Vector3(
            Math.sin(simulationProgress * 10 + i) * 3,
            0.5,
            Math.cos(simulationProgress * 10 + i) * 3
          )
          frictionParticles[idx].start()
        }
      }
    } else if (frictionParticles.length > 0) {
      frictionParticles.forEach(p => p.stop && p.stop())
    }

    if (showWrinkleWaves.value) {
      warpYarns.forEach((yarn, i) => {
        if (yarn.position) {
          const wave = Math.sin(simulationProgress * 8 + i * 0.3) * buckleAmplitude.value
          yarn.position.y = wave
        }
      })
      weftYarns.forEach((yarn, j) => {
        if (yarn.position) {
          const wave = Math.cos(simulationProgress * 8 + j * 0.3) * buckleAmplitude.value * 0.8
          yarn.position.y = wave
        }
      })
    }

    if (showBreakParticles.value && simulationProgress > 0.7) {
      createBreakEffect()
    }

    if (layers.value > 1 && simulationData) {
      const slip = interlayerSlip.value
      warpYarns.forEach((yarn, i) => {
        if (i % 2 === 1 && yarn.position) {
          yarn.position.x = Math.sin(simulationProgress * 5) * slip * 2
        }
      })
    }
  } catch (e) {
    console.error('动画更新错误:', e)
  }
}

function createBreakEffect() {
  try {
    if (breakParticles.length >= 20) return
    
    const particleTexture = createParticleTexture(scene)
    const particleSystem = new ParticleSystem('break', 100, scene)
    if (particleTexture) {
      particleSystem.particleTexture = particleTexture
    }
    particleSystem.emitter = new Vector3(
      (Math.random() - 0.5) * 8,
      0.5 + Math.random(),
      (Math.random() - 0.5) * 8
    )
    particleSystem.minEmitBox = new Vector3(-0.05, -0.05, -0.05)
    particleSystem.maxEmitBox = new Vector3(0.05, 0.05, 0.05)
    particleSystem.color1 = new Color4(0.91, 0.27, 0.38, 1)
    particleSystem.color2 = new Color4(0.27, 0.72, 0.91, 1)
    particleSystem.minSize = 0.03
    particleSystem.maxSize = 0.1
    particleSystem.minLifeTime = 0.5
    particleSystem.maxLifeTime = 1.5
    particleSystem.emitRate = 50
    particleSystem.direction1 = new Vector3(-2, 3, -2)
    particleSystem.direction2 = new Vector3(2, 5, 2)
    particleSystem.gravity = new Vector3(0, -9.8, 0)
    particleSystem.start()
    breakParticles.push(particleSystem)

    setTimeout(() => {
      particleSystem.stop()
      setTimeout(() => {
        particleSystem.dispose()
        const idx = breakParticles.indexOf(particleSystem)
        if (idx > -1) breakParticles.splice(idx, 1)
      }, 2000)
    }, 500)
  } catch (e) {
    console.error('创建断裂效果失败:', e)
  }
}

function updateCharts(currentStep) {
  if (!stressChartInstance || !forceChartInstance || !simulationData) return

  try {
    const stressData = simulationData.stressStrainCurve.slice(0, currentStep + 1)
    const forceData = simulationData.contactForces.slice(0, currentStep + 1)

    stressChartInstance.data.datasets[0].data = stressData.map(d => ({ x: d.strain, y: d.stress }))
    forceChartInstance.data.datasets[0].data = forceData.map(d => ({ x: d.displacement, y: d.force }))

    stressChartInstance.update('none')
    forceChartInstance.update('none')
  } catch (e) {
    console.error('图表更新错误:', e)
  }
}

function initCharts() {
  try {
    if (!stressStrainChart.value || !contactForceChart.value) {
      console.warn('图表 canvas 未准备好')
      return
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      scales: {
        x: {
          type: 'linear',
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#aaa' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.1)' },
          ticks: { color: '#aaa' }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }

    stressChartInstance = new Chart(stressStrainChart.value, {
      type: 'line',
      data: {
        datasets: [{
          data: [],
          borderColor: '#e94560',
          backgroundColor: 'rgba(233, 69, 96, 0.2)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: chartOptions
    })

    forceChartInstance = new Chart(contactForceChart.value, {
      type: 'line',
      data: {
        datasets: [{
          data: [],
          borderColor: '#45b7e9',
          backgroundColor: 'rgba(69, 183, 233, 0.2)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }]
      },
      options: chartOptions
    })

    console.log('图表初始化成功')
  } catch (e) {
    console.error('图表初始化失败:', e)
  }
}

async function loadPreset(name) {
  try {
    const response = await fetch(`/api/presets/${encodeURIComponent(name)}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const preset = await response.json()
    if (!preset || !preset.config) {
      throw new Error('预设数据格式错误')
    }
    warpDensity.value = preset.config.warpDensity
    weftTwist.value = preset.config.weftTwist
    weavePattern.value = preset.config.weavePattern
    layers.value = preset.config.layers
    loadType.value = preset.config.loadType
    loadTypeLabel.value = loadTypeLabels[loadType.value] || loadType.value
    updateFabric()
    console.log('预设加载成功:', name)
  } catch (e) {
    console.error('加载预设失败:', e)
    const fallbackPresets = {
      '平纹布拉伸预设': { warpDensity: 20, weftTwist: 300, weavePattern: 'plain', layers: 1, loadType: 'tensile' },
      '斜纹布剪切预设': { warpDensity: 25, weftTwist: 400, weavePattern: 'twill', layers: 1, loadType: 'shear' },
      '缎纹布顶破预设': { warpDensity: 30, weftTwist: 500, weavePattern: 'satin', layers: 1, loadType: 'bursting' },
      '多层复合弯曲预设': { warpDensity: 22, weftTwist: 350, weavePattern: 'multi_layer', layers: 3, loadType: 'bending' }
    }
    const fallback = fallbackPresets[name]
    if (fallback) {
      warpDensity.value = fallback.warpDensity
      weftTwist.value = fallback.weftTwist
      weavePattern.value = fallback.weavePattern
      layers.value = fallback.layers
      loadType.value = fallback.loadType
      loadTypeLabel.value = loadTypeLabels[loadType.value] || loadType.value
      updateFabric()
      console.log('使用本地预设数据:', name)
    }
  }
}

function updateFabric() {
  createFabric()
}

async function startSimulation() {
  if (isSimulating.value) {
    isSimulating.value = false
    return
  }

  isSimulating.value = true
  simulationProgress = 0
  breakParticles = []

  try {
    const response = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          warpDensity: warpDensity.value,
          weftTwist: weftTwist.value,
          weavePattern: weavePattern.value,
          layers: layers.value,
          yarnProperties: {
            warp: { youngsModulus: 10 },
            weft: { youngsModulus: 8 }
          }
        },
        loadParams: {
          loadType: loadType.value,
          maxDisplacement: maxDisplacement.value,
          steps: 50
        }
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('响应不是 JSON 格式')
    }
    
    simulationData = await response.json()
    console.log('模拟数据获取成功')
  } catch (e) {
    console.error('模拟失败:', e)
    simulationData = generateLocalSimulationData()
    console.log('使用本地模拟数据')
  }
}

function generateLocalSimulationData() {
  const steps = 50
  const contactForces = []
  const stressStrainCurve = []
  const buckleAmplitudes = []
  const stressConcentrations = []
  const poissonsRatios = []
  const interlayerSlips = []

  for (let i = 0; i <= steps; i++) {
    const displacement = (i / steps) * maxDisplacement.value
    const strain = displacement / 100

    const contactForce = warpDensity.value * weftTwist.value * 0.01 * Math.exp(displacement * 0.1)
    const stress = 10 * strain * (1 + 0.3 * strain * strain)
    const buckle = 0.5 * Math.abs(10 / 8 - 1) * Math.sin(strain * Math.PI)
    let concentration = 1.0
    switch (weavePattern.value) {
      case 'plain': concentration = 1.5 + 0.5 * Math.sin(strain * 10); break
      case 'twill': concentration = 1.3 + 0.3 * Math.sin(strain * 8); break
      case 'satin': concentration = 1.8 + 0.4 * Math.sin(strain * 12); break
      case 'multi_layer': concentration = 2.0 + 0.6 * Math.sin(strain * 6); break
    }
    let poisson = 0.3 - 0.5 * Math.tanh(strain * 5)
    if (loadType.value === 'shear' && strain > 0.3) {
      poisson = -poisson * Math.min(1, (strain - 0.3) * 5)
    }
    const slip = 0.1 * layers.value * strain * strain

    contactForces.push({ displacement, force: contactForce })
    stressStrainCurve.push({ strain, stress })
    buckleAmplitudes.push({ displacement, amplitude: buckle })
    stressConcentrations.push({ displacement, factor: concentration })
    poissonsRatios.push({ strain, ratio: poisson })
    interlayerSlips.push({ displacement, slip })
  }

  return {
    contactForces,
    stressStrainCurve,
    buckleAmplitudes,
    stressConcentrations,
    poissonsRatios,
    interlayerSlips
  }
}

function resetSimulation() {
  isSimulating.value = false
  simulationProgress = 0
  simulationData = null
  currentContactForce.value = 0
  stressConcentration.value = 1
  poissonsRatio.value = 0.3
  interlayerSlip.value = 0
  buckleAmplitude.value = 0

  if (stressChartInstance) {
    stressChartInstance.data.datasets[0].data = []
    stressChartInstance.update()
  }
  if (forceChartInstance) {
    forceChartInstance.data.datasets[0].data = []
    forceChartInstance.update()
  }

  warpYarns.forEach(y => {
    if (y.scaling) y.scaling.set(1, 1, 1)
    if (y.position) y.position.set(0, 0, 0)
  })
  weftYarns.forEach(y => {
    if (y.scaling) y.scaling.set(1, 1, 1)
    if (y.position) y.position.set(0, 0, 0)
  })

  frictionParticles.forEach(p => p.stop && p.stop())
}

onMounted(() => {
  console.log('组件挂载，开始初始化...')
  initBabylon()
  setTimeout(() => {
    initCharts()
  }, 200)
})

onUnmounted(() => {
  if (engine) engine.dispose()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (stressChartInstance) stressChartInstance.destroy()
  if (forceChartInstance) forceChartInstance.destroy()
})
</script>
