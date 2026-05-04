import { defineStore } from 'pinia'
import { ref } from 'vue'
import { squareApi, presetApi } from '@/api'

export const useSquareStore = defineStore('square', () => {
  const currentSquare = ref(null)
  const squares = ref([])
  const layers = ref([])
  const artifacts = ref([])
  const boundaries = ref([])
  const logs = ref([])
  const presets = ref([])
  const loading = ref(false)

  async function fetchPresets() {
    try {
      const res = await presetApi.list()
      if (res.data.success) {
        presets.value = res.data.data
      }
    } catch (error) {
      console.error('获取预设列表失败:', error)
    }
  }

  async function fetchSquares() {
    loading.value = true
    try {
      const res = await squareApi.list()
      if (res.data.success) {
        squares.value = res.data.data
      }
    } catch (error) {
      console.error('获取探方列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function createSquare(data) {
    loading.value = true
    try {
      const res = await squareApi.create(data)
      if (res.data.success) {
        squares.value.unshift(res.data.data)
        return res.data.data
      }
    } catch (error) {
      console.error('创建探方失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function applyPreset(code, data = {}) {
    loading.value = true
    try {
      const res = await presetApi.apply(code, data)
      if (res.data.success) {
        await fetchSquares()
        return res.data.data
      }
    } catch (error) {
      console.error('应用预设失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteSquare(id) {
    try {
      await squareApi.delete(id)
      squares.value = squares.value.filter(s => s.id !== id)
    } catch (error) {
      console.error('删除探方失败:', error)
      throw error
    }
  }

  return {
    currentSquare,
    squares,
    layers,
    artifacts,
    boundaries,
    logs,
    presets,
    loading,
    fetchPresets,
    fetchSquares,
    createSquare,
    applyPreset,
    deleteSquare
  }
})