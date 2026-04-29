<template>
  <div class="canvas-container">
    <h3>🔬 实时模拟</h3>
    <div class="canvas-wrapper">
      <canvas 
        ref="mainCanvas" 
        class="main-canvas"
        :width="canvasSize"
        :height="canvasSize"
      ></canvas>
      <canvas 
        ref="heatmapCanvas" 
        class="heatmap-canvas"
        :width="canvasSize"
        :height="canvasSize"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useSimulation } from '../composables/useSimulation'

const mainCanvas = ref(null)
const heatmapCanvas = ref(null)
const canvasSize = 600

const { people, riskMap, quarantineZones, params, isRunning } = useSimulation()

let mainCtx = null
let heatmapCtx = null
let animationFrame = null
let prevPositions = new Map()
let transitionProgress = new Map()
let pulsePhase = 0

const cellSize = computed(() => {
  return canvasSize / (params.value.gridSize || 50)
})

const getPersonColor = (person) => {
  if (person.vaccinated) return '#4CAF50'
  if (person.recovered) return '#2196F3'
  if (person.isolated) return '#FF9800'
  if (person.infected) return '#F44336'
  return '#9E9E9E'
}

const getRiskColor = (risk, maxRisk = 5) => {
  const intensity = Math.min(risk / maxRisk, 1)
  const r = Math.floor(255 * intensity)
  const g = Math.floor(255 * (1 - intensity))
  const b = 100
  return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`
}

const drawGrid = () => {
  const size = cellSize.value
  const gridSize = params.value.gridSize || 50

  mainCtx.strokeStyle = 'rgba(200, 200, 200, 0.3)'
  mainCtx.lineWidth = 0.5

  for (let i = 0; i <= gridSize; i++) {
    mainCtx.beginPath()
    mainCtx.moveTo(i * size, 0)
    mainCtx.lineTo(i * size, canvasSize)
    mainCtx.stroke()

    mainCtx.beginPath()
    mainCtx.moveTo(0, i * size)
    mainCtx.lineTo(canvasSize, i * size)
    mainCtx.stroke()
  }
}

const drawQuarantineZones = () => {
  const size = cellSize.value

  quarantineZones.value.forEach(zone => {
    const [x, y] = zone.split(',').map(Number)
    
    const timeFactor = (Math.sin(pulsePhase * 0.05) + 1) / 2
    const alpha = 0.2 + timeFactor * 0.15

    mainCtx.fillStyle = `rgba(255, 152, 0, ${alpha})`
    mainCtx.fillRect(x * size, y * size, size, size)

    mainCtx.strokeStyle = `rgba(255, 87, 34, ${0.5 + timeFactor * 0.3})`
    mainCtx.lineWidth = 2
    mainCtx.setLineDash([5, 5])
    mainCtx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2)
    mainCtx.setLineDash([])
  })
}

const drawPerson = (person, progress = 1) => {
  const size = cellSize.value
  const radius = size * 0.35

  let x = person.x * size + size / 2
  let y = person.y * size + size / 2

  const prevPos = prevPositions.get(person.id)
  if (prevPos && progress < 1) {
    x = prevPos.x + (x - prevPos.x) * progress
    y = prevPos.y + (y - prevPos.y) * progress
  }

  const color = getPersonColor(person)

  if (person.infected) {
    const pulseRadius = radius * (1 + 0.3 * Math.sin(pulsePhase * 0.1 + person.id * 0.5))
    const gradient = mainCtx.createRadialGradient(x, y, 0, x, y, pulseRadius * 2)
    gradient.addColorStop(0, 'rgba(244, 67, 54, 0.3)')
    gradient.addColorStop(1, 'rgba(244, 67, 54, 0)')
    mainCtx.fillStyle = gradient
    mainCtx.beginPath()
    mainCtx.arc(x, y, pulseRadius * 2, 0, Math.PI * 2)
    mainCtx.fill()
  }

  mainCtx.beginPath()
  mainCtx.arc(x, y, radius, 0, Math.PI * 2)
  mainCtx.fillStyle = color
  mainCtx.fill()

  mainCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  mainCtx.lineWidth = 1
  mainCtx.stroke()

  if (person.isolated) {
    mainCtx.strokeStyle = '#FF5722'
    mainCtx.lineWidth = 2
    mainCtx.setLineDash([3, 2])
    mainCtx.beginPath()
    mainCtx.arc(x, y, radius + 3, 0, Math.PI * 2)
    mainCtx.stroke()
    mainCtx.setLineDash([])
  }
}

const drawPeople = () => {
  people.value.forEach(person => {
    const progress = transitionProgress.get(person.id) || 1
    drawPerson(person, progress)
  })
}

const drawHeatmap = () => {
  const size = cellSize.value
  const gridSize = params.value.gridSize || 50

  heatmapCtx.clearRect(0, 0, canvasSize, canvasSize)

  for (let y = 0; y < riskMap.value.length; y++) {
    const row = riskMap.value[y]
    if (!row) continue

    for (let x = 0; x < row.length; x++) {
      const cell = row[x]
      if (!cell) continue

      if (cell.risk > 0) {
        heatmapCtx.fillStyle = getRiskColor(cell.risk)
        heatmapCtx.fillRect(x * size, y * size, size, size)
      }

      if (cell.quarantined) {
        const timeFactor = (Math.sin(pulsePhase * 0.05) + 1) / 2
        heatmapCtx.strokeStyle = `rgba(255, 87, 34, ${0.5 + timeFactor * 0.3})`
        heatmapCtx.lineWidth = 1.5
        heatmapCtx.setLineDash([4, 4])
        heatmapCtx.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1)
        heatmapCtx.setLineDash([])
      }
    }
  }

  heatmapCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)'
  heatmapCtx.lineWidth = 0.5
  for (let i = 0; i <= gridSize; i++) {
    heatmapCtx.beginPath()
    heatmapCtx.moveTo(i * size, 0)
    heatmapCtx.lineTo(i * size, canvasSize)
    heatmapCtx.stroke()

    heatmapCtx.beginPath()
    heatmapCtx.moveTo(0, i * size)
    heatmapCtx.lineTo(canvasSize, i * size)
    heatmapCtx.stroke()
  }
}

const render = () => {
  if (!mainCtx || !heatmapCtx) return

  mainCtx.clearRect(0, 0, canvasSize, canvasSize)

  drawGrid()
  drawQuarantineZones()
  drawPeople()

  drawHeatmap()

  pulsePhase++

  people.value.forEach(person => {
    const currentKey = `${person.x},${person.y}`
    const prevPos = prevPositions.get(person.id)
    
    if (!prevPos || prevPos.key !== currentKey) {
      prevPositions.set(person.id, {
        x: person.x * cellSize.value + cellSize.value / 2,
        y: person.y * cellSize.value + cellSize.value / 2,
        key: currentKey
      })
      transitionProgress.set(person.id, 0)
    }
    
    const progress = transitionProgress.get(person.id) || 0
    if (progress < 1) {
      transitionProgress.set(person.id, Math.min(progress + 0.15, 1))
    }
  })

  if (isRunning.value) {
    animationFrame = requestAnimationFrame(render)
  }
}

watch(isRunning, (newVal) => {
  if (newVal) {
    pulsePhase = 0
    prevPositions.clear()
    transitionProgress.clear()
    render()
  } else {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }
  }
}, { immediate: true })

watch(people, () => {
  if (!isRunning.value && mainCtx) {
    render()
  }
}, { deep: true })

onMounted(() => {
  if (mainCanvas.value) {
    mainCtx = mainCanvas.value.getContext('2d')
  }
  if (heatmapCanvas.value) {
    heatmapCtx = heatmapCanvas.value.getContext('2d')
  }
  
  if (mainCtx && heatmapCtx) {
    drawGrid()
    drawHeatmap()
  }
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>
