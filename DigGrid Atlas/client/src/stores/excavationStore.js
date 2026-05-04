import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { layerApi, artifactApi, boundaryApi, logApi, squareApi } from '@/api'

export const useExcavationStore = defineStore('excavation', () => {
  const squareId = ref(null)
  const squareInfo = ref(null)
  const layers = ref([])
  const artifacts = ref([])
  const boundaries = ref([])
  const logs = ref([])
  const selectedArtifact = ref(null)
  const selectedBoundary = ref(null)
  const isStripping = ref(false)
  const currentLayerIndex = ref(0)
  const toolMode = ref('select')
  const measurementStart = ref(null)
  const measurementEnd = ref(null)
  const boundaryPoints = ref([])
  const isDrawingBoundary = ref(false)
  const loading = ref(false)

  const currentLayer = computed(() => {
    return layers.value[currentLayerIndex.value]
  })

  const strippedLayers = computed(() => {
    return layers.value.filter(l => l.is_stripped === 1 || l.is_stripped === true)
  })

  const visibleArtifacts = computed(() => {
    const strippedDepth = strippedLayers.value.reduce((sum, l) => sum + (l.depth_end - l.depth_start), 0)
    return artifacts.value.filter(a => Math.abs(a.position_y) <= strippedDepth + 0.1)
  })

  async function loadSquare(id) {
    squareId.value = id
    loading.value = true
    try {
      const [squareRes, layersRes, artifactsRes, boundariesRes, logsRes] = await Promise.all([
        squareApi.get(id),
        layerApi.getBySquare(id),
        artifactApi.getBySquare(id),
        boundaryApi.getBySquare(id),
        logApi.getBySquare(id)
      ])

      if (squareRes.data.success) {
        squareInfo.value = squareRes.data.data
      }
      if (layersRes.data.success) {
        layers.value = layersRes.data.data.sort((a, b) => a.order_index - b.order_index)
        const strippedCount = layers.value.filter(l => l.is_stripped === 1).length
        currentLayerIndex.value = strippedCount
      }
      if (artifactsRes.data.success) {
        artifacts.value = artifactsRes.data.data
      }
      if (boundariesRes.data.success) {
        boundaries.value = boundariesRes.data.data
      }
      if (logsRes.data.success) {
        logs.value = logsRes.data.data
      }
    } catch (error) {
      console.error('加载探方数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function stripCurrentLayer() {
    if (isStripping.value || currentLayerIndex.value >= layers.value.length) return
    
    const layer = layers.value[currentLayerIndex.value]
    if (!layer) return
    
    isStripping.value = true
    
    try {
      await layerApi.strip(layer.id)
      layer.is_stripped = 1
      currentLayerIndex.value++
      
      await addLog(
        `剥离土层: ${layer.name}`,
        `成功剥离探方 ${squareInfo.value?.name || ''} 的 ${layer.name}，深度范围: ${layer.depth_start}m - ${layer.depth_end}m`
      )
    } catch (error) {
      console.error('剥离土层失败:', error)
      throw error
    } finally {
      isStripping.value = false
    }
  }

  async function createArtifact(data) {
    try {
      const res = await artifactApi.create({
        ...data,
        square_id: squareId.value
      })
      if (res.data.success) {
        artifacts.value.push(res.data.data)
        await addLog(
          `发现文物: ${res.data.data.name || res.data.data.code}`,
          `在位置 (${data.position_x}, ${data.position_y}, ${data.position_z}) 发现文物 ${res.data.data.code}，类型: ${data.type}`
        )
        return res.data.data
      }
    } catch (error) {
      console.error('创建文物失败:', error)
      throw error
    }
  }

  async function updateArtifact(id, data) {
    try {
      await artifactApi.update(id, data)
      const index = artifacts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        artifacts.value[index] = { ...artifacts.value[index], ...data }
      }
    } catch (error) {
      console.error('更新文物失败:', error)
      throw error
    }
  }

  async function deleteArtifact(id) {
    try {
      await artifactApi.delete(id)
      artifacts.value = artifacts.value.filter(a => a.id !== id)
      if (selectedArtifact.value?.id === id) {
        selectedArtifact.value = null
      }
    } catch (error) {
      console.error('删除文物失败:', error)
      throw error
    }
  }

  async function createBoundary(data) {
    try {
      const res = await boundaryApi.create({
        ...data,
        square_id: squareId.value
      })
      if (res.data.success) {
        boundaries.value.push(res.data.data)
        await addLog(
          `标记边界: ${data.name}`,
          `在探方中标记了 ${data.type} 边界: ${data.name}`
        )
        return res.data.data
      }
    } catch (error) {
      console.error('创建边界失败:', error)
      throw error
    }
  }

  async function deleteBoundary(id) {
    try {
      await boundaryApi.delete(id)
      boundaries.value = boundaries.value.filter(b => b.id !== id)
      if (selectedBoundary.value?.id === id) {
        selectedBoundary.value = null
      }
    } catch (error) {
      console.error('删除边界失败:', error)
      throw error
    }
  }

  async function addLog(title, content) {
    try {
      const res = await logApi.create({
        square_id: squareId.value,
        title,
        content
      })
      if (res.data.success) {
        logs.value.unshift(res.data.data)
      }
    } catch (error) {
      console.error('添加日志失败:', error)
    }
  }

  function startMeasurement(point) {
    measurementStart.value = point
    measurementEnd.value = null
  }

  function endMeasurement(point) {
    measurementEnd.value = point
  }

  function clearMeasurement() {
    measurementStart.value = null
    measurementEnd.value = null
  }

  function startDrawingBoundary() {
    isDrawingBoundary.value = true
    boundaryPoints.value = []
  }

  function addBoundaryPoint(point) {
    boundaryPoints.value.push(point)
  }

  function cancelDrawingBoundary() {
    isDrawingBoundary.value = false
    boundaryPoints.value = []
  }

  function reset() {
    squareId.value = null
    squareInfo.value = null
    layers.value = []
    artifacts.value = []
    boundaries.value = []
    logs.value = []
    selectedArtifact.value = null
    selectedBoundary.value = null
    isStripping.value = false
    currentLayerIndex.value = 0
    toolMode.value = 'select'
    measurementStart.value = null
    measurementEnd.value = null
    boundaryPoints.value = []
    isDrawingBoundary.value = false
  }

  return {
    squareId,
    squareInfo,
    layers,
    artifacts,
    boundaries,
    logs,
    selectedArtifact,
    selectedBoundary,
    isStripping,
    currentLayerIndex,
    toolMode,
    measurementStart,
    measurementEnd,
    boundaryPoints,
    isDrawingBoundary,
    loading,
    currentLayer,
    strippedLayers,
    visibleArtifacts,
    loadSquare,
    stripCurrentLayer,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    createBoundary,
    deleteBoundary,
    addLog,
    startMeasurement,
    endMeasurement,
    clearMeasurement,
    startDrawingBoundary,
    addBoundaryPoint,
    cancelDrawingBoundary,
    reset
  }
})