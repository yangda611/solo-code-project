<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSimulation } from './composables/useSimulation'
import { useLocalStorage } from './composables/useLocalStorage'
import InputForm from './components/InputForm.vue'
import BudgetCard from './components/BudgetCard.vue'
import CashFlowChart from './components/CashFlowChart.vue'
import RiskModal from './components/RiskModal.vue'
import FlashAlert from './components/FlashAlert.vue'

const {
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
} = useSimulation()

const {
  loadFromStorage,
  setupAutoSave,
  clearStorage
} = useLocalStorage({
  monthlyIncome,
  fixedExpenses,
  randomExpenseRange,
  emergencyProbability,
  emergencyAmount,
  warningThreshold,
  initialSavings
})

const showRiskModal = ref(false)
const riskModalTitle = ref('')
const riskModalMessage = ref('')
const riskModalDetails = ref(null)
const isWarningModal = ref(false)

const showFlashAlert = ref(false)
const flashAlertTitle = ref('')
const flashAlertMessage = ref('')
const flashAlertType = ref('warning')
const flashAlertCurrentAmount = ref(0)
const flashAlertThreshold = ref(0)
const flashAlertShowAmount = ref(false)

let flashTimeout = null

watch(currentMonthIndex, (newIndex) => {
  if (newIndex >= 0 && newIndex < simulationResults.value.length) {
    const monthData = simulationResults.value[newIndex]
    
    if (monthData.belowThreshold) {
      showFlashWarning(
        '资金跌破警戒线！',
        `${monthData.monthName}资金余额低于设定警戒线`,
        'danger',
        monthData.endSavings,
        warningThreshold.value
      )
    }
    
    if (monthData.emergencyOccurred) {
      setTimeout(() => {
        showFlashWarning(
          '突发事件发生！',
          `${monthData.monthName}发生突发事件，支出 ¥${monthData.emergencyCost.toLocaleString()}`,
          'warning'
        )
      }, 500)
    }
  }
})

watch(isSimulating, (newVal, oldVal) => {
  if (oldVal && !newVal && simulationResults.value.length > 0) {
    setTimeout(() => {
      checkSimulationResults()
    }, 500)
  }
})

const showFlashWarning = (title, message, type = 'warning', currentAmount = 0, threshold = 0) => {
  if (flashTimeout) {
    clearTimeout(flashTimeout)
  }
  
  flashAlertTitle.value = title
  flashAlertMessage.value = message
  flashAlertType.value = type
  flashAlertCurrentAmount.value = currentAmount
  flashAlertThreshold.value = threshold
  flashAlertShowAmount.value = type === 'danger'
  showFlashAlert.value = true
  
  flashTimeout = setTimeout(() => {
    showFlashAlert.value = false
  }, 3000)
}

const checkSimulationResults = () => {
  const results = simulationResults.value
  const finalSavings = results[results.length - 1].endSavings
  const minSavings = Math.min(...results.map(r => r.endSavings))
  const warningMonths = results.filter(r => r.belowThreshold).length
  
  if (warningMonths > 0) {
    isWarningModal.value = true
    riskModalTitle.value = '风险警告'
    riskModalMessage.value = `模拟结果显示有 ${warningMonths} 个月资金余额低于警戒线，请调整预算或增加收入储备。`
    riskModalDetails.value = {
      finalSavings,
      minSavings,
      warningThreshold: warningThreshold.value,
      warningMonths
    }
    showRiskModal.value = true
  } else if (finalSavings <= 0) {
    isWarningModal.value = true
    riskModalTitle.value = '严重风险警告'
    riskModalMessage.value = '模拟结果显示最终存款为负数，财务状况严重恶化，请立即调整预算方案。'
    riskModalDetails.value = {
      finalSavings,
      minSavings,
      warningThreshold: warningThreshold.value,
      warningMonths
    }
    showRiskModal.value = true
  } else {
    isWarningModal.value = false
    riskModalTitle.value = '模拟完成'
    riskModalMessage.value = '恭喜！12个月模拟完成，财务状况良好，资金余额始终保持在警戒线以上。'
    riskModalDetails.value = {
      finalSavings,
      minSavings,
      warningThreshold: warningThreshold.value,
      warningMonths
    }
    showRiskModal.value = true
  }
}

const handleRunSimulation = () => {
  runSimulation()
}

const handleClearData = () => {
  monthlyIncome.value = 8000
  fixedExpenses.value = [
    { id: 1, name: '房租', amount: 2500 },
    { id: 2, name: '水电费', amount: 300 },
    { id: 3, name: '交通费', amount: 500 }
  ]
  randomExpenseRange.value = { min: 500, max: 1500 }
  emergencyProbability.value = 10
  emergencyAmount.value = 5000
  warningThreshold.value = 5000
  initialSavings.value = 10000
  simulationResults.value = []
  currentMonthIndex.value = -1
  
  clearStorage()
}

const handleModalAction = (action) => {
  switch (action) {
    case 'adjust':
      console.log('用户选择调整参数')
      break
    case 'simulate':
      handleRunSimulation()
      break
    case 'save':
      console.log('用户选择保存方案')
      break
  }
}

onMounted(() => {
  loadFromStorage()
  setupAutoSave()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">预算模拟器</h1>
        <p class="app-subtitle">预测未来12个月的现金流变化，帮助您更好地规划财务</p>
      </div>
    </header>
    
    <main class="main-content">
      <div class="alerts-container">
        <FlashAlert
          v-model:show="showFlashAlert"
          :title="flashAlertTitle"
          :message="flashAlertMessage"
          :type="flashAlertType"
          :current-amount="flashAlertCurrentAmount"
          :threshold="flashAlertThreshold"
          :show-amount="flashAlertShowAmount"
        />
      </div>
      
      <div class="content-grid">
        <div class="left-section">
          <div class="card">
            <InputForm
              v-model:monthly-income="monthlyIncome"
              v-model:initial-savings="initialSavings"
              v-model:warning-threshold="warningThreshold"
              v-model:random-expense-range="randomExpenseRange"
              v-model:emergency-probability="emergencyProbability"
              v-model:emergency-amount="emergencyAmount"
              :is-simulating="isSimulating"
              @run-simulation="handleRunSimulation"
              @clear-data="handleClearData"
            />
          </div>
          
          <div class="card">
            <BudgetCard
              v-model:fixed-expenses="fixedExpenses"
              :total-fixed-expenses="totalFixedExpenses"
              @add-expense="addFixedExpense"
              @remove-expense="removeFixedExpense"
              @update-expense="updateFixedExpense"
              @reorder-expenses="reorderFixedExpenses"
            />
          </div>
        </div>
        
        <div class="right-section">
          <div class="card">
            <CashFlowChart
              :chart-data="simulationResults"
              :warning-threshold="warningThreshold"
              :current-month-index="currentMonthIndex"
              :is-simulating="isSimulating"
            />
          </div>
          
          <div v-if="simulationResults.length > 0" class="card summary-card">
            <h3 class="section-title">模拟摘要</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">总收入</span>
                <span class="summary-value income">
                  ¥{{ (monthlyIncome * 12).toLocaleString() }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">固定支出总计</span>
                <span class="summary-value expense">
                  ¥{{ (totalFixedExpenses * 12).toLocaleString() }}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">模拟月份</span>
                <span class="summary-value">{{ simulationResults.length }} 个月</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">突发事件次数</span>
                <span class="summary-value">
                  {{ simulationResults.filter(r => r.emergencyOccurred).length }} 次
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <RiskModal
      v-model:show="showRiskModal"
      :title="riskModalTitle"
      :message="riskModalMessage"
      :details="riskModalDetails"
      :is-warning="isWarningModal"
      :show-actions="isWarningModal"
      :show-cancel="false"
      :confirm-text="'了解'"
      @action="handleModalAction"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg, #f8fafc) 0%, var(--card-bg, #f1f5f9) 100%);
}

.app-header {
  background: var(--bg, #fff);
  border-bottom: 1px solid var(--border, #e0e0e0);
  padding: 24px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-h, #333);
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--accent, #6366f1), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 15px;
  color: var(--text, #666);
  margin: 0;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 20px;
}

.alerts-container {
  margin-bottom: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.right-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: var(--bg, #fff);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border, #e0e0e0);
  overflow: hidden;
}

.summary-card {
  padding: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h, #333);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--accent, #6366f1);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: var(--card-bg, #f9f9f9);
  border-radius: 12px;
  border: 1px solid var(--border, #e0e0e0);
  transition: all 0.3s;
}

.summary-item:hover {
  border-color: var(--accent, #6366f1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.summary-label {
  font-size: 13px;
  color: var(--text, #666);
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-h, #333);
}

.summary-value.income {
  color: #10b981;
}

.summary-value.expense {
  color: #ef4444;
}
</style>
