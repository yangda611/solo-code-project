<template>
  <Transition name="modal-backdrop">
    <div v-if="show" class="modal-backdrop" @click.self="handleClose">
      <Transition name="modal-content">
        <div class="modal-content" :class="{ 'warning-modal': isWarning, 'info-modal': !isWarning }">
          <div class="modal-icon">
            <svg v-if="isWarning" width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="btn-close" @click="handleClose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" 
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
            
            <div v-if="details" class="modal-details">
              <div v-for="(detail, index) in detailsList" :key="index" class="detail-item">
                <span class="detail-label">{{ detail.label }}:</span>
                <span class="detail-value" :class="detail.class">{{ detail.value }}</span>
              </div>
            </div>
            
            <div v-if="showActions" class="risk-actions">
              <div class="action-card" @click="emitAction('adjust')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="action-label">调整参数</span>
              </div>
              
              <div class="action-card" @click="emitAction('simulate')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="action-label">重新模拟</span>
              </div>
              
              <div class="action-card" @click="emitAction('save')">
                <div class="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="action-label">保存方案</span>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button v-if="showCancel" class="btn btn-secondary" @click="handleClose">
              {{ cancelText }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    default: ''
  },
  details: {
    type: Object,
    default: null
  },
  isWarning: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: false
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['update:show', 'confirm', 'cancel', 'action'])

const detailsList = computed(() => {
  if (!props.details) return []
  return Object.entries(props.details).map(([key, value]) => {
    let label = key
    let val = value
    let className = ''
    
    switch (key) {
      case 'finalSavings':
        label = '最终存款'
        val = `¥${value.toLocaleString()}`
        className = value < props.details?.warningThreshold ? 'danger' : ''
        break
      case 'warningThreshold':
        label = '警戒线'
        val = `¥${value.toLocaleString()}`
        break
      case 'warningMonths':
        label = '跌破月份'
        val = `${value} 个月`
        className = value > 0 ? 'danger' : 'success'
        break
      case 'minSavings':
        label = '最低存款'
        val = `¥${value.toLocaleString()}`
        className = value < props.details?.warningThreshold ? 'danger' : ''
        break
      default:
        val = String(value)
    }
    
    return { label, value: val, class: className }
  })
})

const handleClose = () => {
  emit('update:show', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('update:show', false)
  emit('confirm')
}

const emitAction = (action) => {
  emit('action', action)
  emit('update:show', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg, #fff);
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
}

.modal-content.warning-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ef4444, #f97316);
  animation: warningPulse 2s ease-in-out infinite;
}

@keyframes warningPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.modal-content.info-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
}

.modal-icon {
  display: flex;
  justify-content: center;
  padding: 24px 24px 0;
}

.warning-modal .modal-icon {
  color: #ef4444;
  animation: iconShake 0.5s ease-in-out;
}

.info-modal .modal-icon {
  color: #6366f1;
}

@keyframes iconShake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-h, #333);
  margin: 0;
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text, #666);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--border, #e0e0e0);
  color: var(--text-h, #333);
}

.modal-body {
  padding: 16px 24px;
}

.modal-message {
  font-size: 15px;
  color: var(--text, #666);
  line-height: 1.6;
  margin: 0;
}

.modal-details {
  margin-top: 20px;
  padding: 16px;
  background: var(--card-bg, #f9f9f9);
  border-radius: 12px;
  border: 1px solid var(--border, #e0e0e0);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border, #e0e0e0);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 14px;
  color: var(--text, #666);
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h, #333);
}

.detail-value.danger {
  color: #ef4444;
  animation: valueFlash 1s ease-in-out infinite;
}

.detail-value.success {
  color: #10b981;
}

@keyframes valueFlash {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.risk-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bg, #fff);
  border: 2px solid var(--border, #e0e0e0);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  border-color: var(--accent, #6366f1);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
}

.action-icon {
  color: var(--accent, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #666);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px 24px;
  border-top: 1px solid var(--border, #e0e0e0);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: var(--accent, #6366f1);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-dark, #4f46e5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: transparent;
  color: var(--text, #666);
  border: 2px solid var(--border, #e0e0e0);
}

.btn-secondary:hover {
  background: var(--card-bg, #f9f9f9);
  border-color: var(--text, #666);
}

.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

.modal-content-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-content-leave-active {
  transition: all 0.2s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
