<template>
  <div class="budget-card-container">
    <div class="card-header">
      <h3 class="section-title">固定支出</h3>
      <button class="btn-add" @click="showAddForm = !showAddForm">
        <span class="icon">+</span> 添加支出
      </button>
    </div>
    
    <Transition name="slide-down">
      <div v-if="showAddForm" class="add-form">
        <input 
          type="text" 
          v-model="newExpenseName"
          placeholder="支出名称"
          class="form-input"
        />
        <input 
          type="number" 
          v-model.number="newExpenseAmount"
          placeholder="金额"
          min="0"
          class="form-input"
        />
        <button class="btn-save" @click="addNewExpense">保存</button>
        <button class="btn-cancel" @click="cancelAdd">取消</button>
      </div>
    </Transition>
    
    <div class="cards-list" ref="listRef">
      <TransitionGroup name="list">
        <div 
          v-for="(expense, index) in localExpenses" 
          :key="expense.id"
          class="card-item"
          :class="{ 'dragging': draggedItem?.id === expense.id }"
          :draggable="true"
          @dragstart="handleDragStart($event, expense, index)"
          @dragenter="handleDragEnter($event, index)"
          @dragend="handleDragEnd"
          @dragover.prevent
        >
          <div class="drag-handle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" 
                fill="currentColor"/>
            </svg>
          </div>
          
          <div class="card-content">
            <input 
              type="text" 
              v-model="expense.name"
              @input="updateExpense(expense.id, 'name', expense.name)"
              class="expense-name"
            />
            <div class="expense-amount-wrapper">
              <span class="currency">¥</span>
              <input 
                type="number" 
                v-model.number="expense.amount"
                @input="updateExpense(expense.id, 'amount', expense.amount)"
                min="0"
                class="expense-amount"
              />
            </div>
          </div>
          
          <button class="btn-delete" @click="removeExpense(expense.id)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
      
      <div v-if="localExpenses.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity: 0.3;">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>暂无固定支出，点击上方按钮添加</p>
      </div>
    </div>
    
    <div class="total-section">
      <span class="total-label">固定支出总计：</span>
      <span class="total-amount">¥{{ totalFixedExpenses.toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  fixedExpenses: {
    type: Array,
    required: true
  },
  totalFixedExpenses: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'update:fixedExpenses',
  'addExpense',
  'removeExpense',
  'updateExpense',
  'reorderExpenses'
])

const localExpenses = ref([...props.fixedExpenses])
const showAddForm = ref(false)
const newExpenseName = ref('')
const newExpenseAmount = ref(null)
const draggedItem = ref(null)
const draggedIndex = ref(-1)

watch(() => props.fixedExpenses, (val) => {
  localExpenses.value = [...val]
}, { deep: true })

const addNewExpense = () => {
  if (newExpenseName.value.trim() && newExpenseAmount.value > 0) {
    emit('addExpense', newExpenseName.value.trim(), newExpenseAmount.value)
    newExpenseName.value = ''
    newExpenseAmount.value = null
    showAddForm.value = false
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  newExpenseName.value = ''
  newExpenseAmount.value = null
}

const removeExpense = (id) => {
  emit('removeExpense', id)
}

const updateExpense = (id, field, value) => {
  emit('updateExpense', id, field, value)
}

const handleDragStart = (event, item, index) => {
  draggedItem.value = item
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const handleDragEnter = (event, index) => {
  event.preventDefault()
  if (draggedIndex.value !== -1 && draggedIndex.value !== index) {
    const newList = [...localExpenses.value]
    const [removed] = newList.splice(draggedIndex.value, 1)
    newList.splice(index, 0, removed)
    localExpenses.value = newList
    draggedIndex.value = index
    emit('reorderExpenses', localExpenses.value)
  }
}

const handleDragEnd = () => {
  draggedItem.value = null
  draggedIndex.value = -1
}
</script>

<style scoped>
.budget-card-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-h, #333);
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  color: var(--accent, #6366f1);
  border: 2px solid var(--accent, #6366f1);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add:hover {
  background: var(--accent, #6366f1);
  color: white;
  transform: translateY(-1px);
}

.icon {
  font-size: 18px;
  line-height: 1;
}

.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
  background: var(--card-bg, #f9f9f9);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 2px dashed var(--accent, #6366f1);
}

.form-input {
  flex: 1;
  min-width: 150px;
  padding: 10px 12px;
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
}

.btn-save {
  padding: 10px 20px;
  background: var(--accent, #6366f1);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save:hover {
  background: var(--accent-dark, #4f46e5);
}

.btn-cancel {
  padding: 10px 20px;
  background: transparent;
  color: var(--text, #666);
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: var(--border, #e0e0e0);
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 80px;
}

.card-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--card-bg, #f9f9f9);
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 12px;
  cursor: grab;
  transition: all 0.3s;
}

.card-item:hover {
  border-color: var(--accent, #6366f1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.card-item.dragging {
  opacity: 0.5;
  transform: scale(1.02);
  cursor: grabbing;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: var(--text, #666);
  cursor: grab;
  border-radius: 6px;
  transition: all 0.2s;
}

.drag-handle:hover {
  background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  color: var(--accent, #6366f1);
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.expense-name {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-h, #333);
  background: transparent;
  transition: all 0.3s;
}

.expense-name:hover {
  background: var(--bg, #fff);
}

.expense-name:focus {
  outline: none;
  background: var(--bg, #fff);
  border-color: var(--accent, #6366f1);
}

.expense-amount-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

.currency {
  font-size: 15px;
  color: var(--text, #666);
  font-weight: 600;
}

.expense-amount {
  width: 100px;
  padding: 8px 12px;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-h, #333);
  text-align: right;
  background: transparent;
  transition: all 0.3s;
}

.expense-amount:hover {
  background: var(--bg, #fff);
}

.expense-amount:focus {
  outline: none;
  background: var(--bg, #fff);
  border-color: var(--accent, #6366f1);
}

.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: transparent;
  color: #ef4444;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: scale(1.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text, #666);
  text-align: center;
  border: 2px dashed var(--border, #e0e0e0);
  border-radius: 12px;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

.total-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 20px;
  background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  border-radius: 12px;
  border: 2px solid var(--accent, #6366f1);
}

.total-label {
  font-size: 16px;
  color: var(--text, #666);
  font-weight: 500;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent, #6366f1);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
