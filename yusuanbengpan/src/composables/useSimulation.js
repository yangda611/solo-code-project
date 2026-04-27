import { ref, computed } from 'vue'

export function useSimulation() {
  const monthlyIncome = ref(8000)
  const fixedExpenses = ref([
    { id: 1, name: '房租', amount: 2500 },
    { id: 2, name: '水电费', amount: 300 },
    { id: 3, name: '交通费', amount: 500 }
  ])
  const randomExpenseRange = ref({ min: 500, max: 1500 })
  const emergencyProbability = ref(10)
  const emergencyAmount = ref(5000)
  const warningThreshold = ref(5000)
  const initialSavings = ref(10000)
  
  const simulationResults = ref([])
  const isSimulating = ref(false)
  const currentMonthIndex = ref(-1)
  
  const totalFixedExpenses = computed(() => {
    return fixedExpenses.value.reduce((sum, exp) => sum + exp.amount, 0)
  })
  
  const generateRandomExpense = () => {
    const { min, max } = randomExpenseRange.value
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  const isEmergencyOccurred = () => {
    return Math.random() * 100 < emergencyProbability.value
  }
  
  const runSimulation = () => {
    isSimulating.value = true
    simulationResults.value = []
    currentMonthIndex.value = -1
    
    let currentSavings = initialSavings.value
    const results = []
    
    for (let month = 0; month < 12; month++) {
      const monthData = {
        month: month + 1,
        monthName: getMonthName(month),
        income: monthlyIncome.value,
        fixedExpenses: totalFixedExpenses.value,
        randomExpense: generateRandomExpense(),
        emergencyOccurred: isEmergencyOccurred(),
        emergencyCost: 0,
        netCashFlow: 0,
        startSavings: currentSavings,
        endSavings: 0,
        belowThreshold: false
      }
      
      if (monthData.emergencyOccurred) {
        monthData.emergencyCost = emergencyAmount.value
      }
      
      monthData.netCashFlow = monthData.income - 
        monthData.fixedExpenses - 
        monthData.randomExpense - 
        monthData.emergencyCost
      
      monthData.endSavings = monthData.startSavings + monthData.netCashFlow
      monthData.belowThreshold = monthData.endSavings < warningThreshold.value
      
      currentSavings = monthData.endSavings
      results.push(monthData)
    }
    
    simulationResults.value = results
    
    let index = 0
    const animateInterval = setInterval(() => {
      if (index < results.length) {
        currentMonthIndex.value = index
        index++
      } else {
        clearInterval(animateInterval)
        isSimulating.value = false
      }
    }, 300)
  }
  
  const getMonthName = (index) => {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月', 
                    '七月', '八月', '九月', '十月', '十一月', '十二月']
    return months[index]
  }
  
  const addFixedExpense = (name, amount) => {
    const newId = Math.max(...fixedExpenses.value.map(e => e.id), 0) + 1
    fixedExpenses.value.push({ id: newId, name, amount })
  }
  
  const removeFixedExpense = (id) => {
    const index = fixedExpenses.value.findIndex(e => e.id === id)
    if (index > -1) {
      fixedExpenses.value.splice(index, 1)
    }
  }
  
  const updateFixedExpense = (id, field, value) => {
    const expense = fixedExpenses.value.find(e => e.id === id)
    if (expense) {
      expense[field] = value
    }
  }
  
  const reorderFixedExpenses = (newOrder) => {
    fixedExpenses.value = newOrder
  }
  
  return {
    monthlyIncome,
    fixedExpenses,
    randomExpenseRange,
    emergencyProbability,
    emergencyAmount,
    warningThreshold,
    initialSavings,
    simulationResults,
    isSimulating,
    currentMonthIndex,
    totalFixedExpenses,
    runSimulation,
    addFixedExpense,
    removeFixedExpense,
    updateFixedExpense,
    reorderFixedExpenses
  }
}
