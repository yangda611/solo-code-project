import { watch, ref } from 'vue'

const STORAGE_KEY = 'budget-simulator-data'

export function useLocalStorage(simulationData) {
  const isLoaded = ref(false)
  
  const loadFromStorage = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        
        if (parsed.monthlyIncome !== undefined) {
          simulationData.monthlyIncome.value = parsed.monthlyIncome
        }
        if (parsed.fixedExpenses !== undefined) {
          simulationData.fixedExpenses.value = parsed.fixedExpenses
        }
        if (parsed.randomExpenseRange !== undefined) {
          simulationData.randomExpenseRange.value = parsed.randomExpenseRange
        }
        if (parsed.emergencyProbability !== undefined) {
          simulationData.emergencyProbability.value = parsed.emergencyProbability
        }
        if (parsed.emergencyAmount !== undefined) {
          simulationData.emergencyAmount.value = parsed.emergencyAmount
        }
        if (parsed.warningThreshold !== undefined) {
          simulationData.warningThreshold.value = parsed.warningThreshold
        }
        if (parsed.initialSavings !== undefined) {
          simulationData.initialSavings.value = parsed.initialSavings
        }
        
        isLoaded.value = true
      }
    } catch (error) {
      console.error('加载本地存储失败:', error)
    }
  }
  
  const saveToStorage = () => {
    try {
      const dataToSave = {
        monthlyIncome: simulationData.monthlyIncome.value,
        fixedExpenses: simulationData.fixedExpenses.value,
        randomExpenseRange: simulationData.randomExpenseRange.value,
        emergencyProbability: simulationData.emergencyProbability.value,
        emergencyAmount: simulationData.emergencyAmount.value,
        warningThreshold: simulationData.warningThreshold.value,
        initialSavings: simulationData.initialSavings.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }
  
  const setupAutoSave = () => {
    const watchOptions = { deep: true, immediate: false }
    
    watch([
      simulationData.monthlyIncome,
      simulationData.fixedExpenses,
      simulationData.randomExpenseRange,
      simulationData.emergencyProbability,
      simulationData.emergencyAmount,
      simulationData.warningThreshold,
      simulationData.initialSavings
    ], () => {
      if (isLoaded.value) {
        saveToStorage()
      }
    }, watchOptions)
  }
  
  const clearStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('清除本地存储失败:', error)
    }
  }
  
  return {
    loadFromStorage,
    saveToStorage,
    setupAutoSave,
    clearStorage,
    isLoaded
  }
}
