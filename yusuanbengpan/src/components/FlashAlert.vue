<template>
  <Transition name="flash-alert">
    <div 
      v-if="show" 
      class="flash-alert"
      :class="{ 'danger': type === 'danger', 'warning': type === 'warning', 'success': type === 'success' }"
    >
      <div class="alert-icon">
        <svg v-if="type === 'danger'" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else-if="type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <div class="alert-content">
        <div class="alert-title">{{ title }}</div>
        <div v-if="message" class="alert-message">{{ message }}</div>
        
        <div v-if="showAmount" class="alert-amount">
          <span class="amount-label">当前金额:</span>
          <span class="amount-value" :class="amountClass">
            ¥{{ formatNumber(currentAmount) }}
          </span>
          <span class="amount-separator">/</span>
          <span class="amount-label">警戒线:</span>
          <span class="amount-value threshold">¥{{ formatNumber(threshold) }}</span>
        </div>
      </div>
      
      <button v-if="showClose" class="btn-close" @click="handleClose">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 18L18 6M6 6l12 12" 
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
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
    default: '警告'
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning'
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  threshold: {
    type: Number,
    default: 0
  },
  showAmount: {
    type: Boolean,
    default: false
  },
  showClose: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:show', 'close'])

const amountClass = computed(() => {
  if (props.currentAmount < props.threshold) {
    return 'below'
  }
  return ''
})

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

const handleClose = () => {
  emit('update:show', false)
  emit('close')
}
</script>

<style scoped>
.flash-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  animation: alertPulse 2s ease-in-out infinite;
}

.flash-alert::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%);
  background-size: 200% 200%;
  animation: shimmer 2s infinite;
  pointer-events: none;
}

@keyframes alertPulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.flash-alert.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.1));
  border: 2px solid #ef4444;
  animation: dangerFlash 0.5s ease-in-out infinite alternate;
}

@keyframes dangerFlash {
  from {
    border-color: #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.1));
  }
  to {
    border-color: #dc2626;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(249, 115, 22, 0.2));
  }
}

.flash-alert.danger .alert-icon {
  color: #ef4444;
  animation: iconBounce 0.5s ease-in-out infinite;
}

@keyframes iconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.flash-alert.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.1));
  border: 2px solid #f59e0b;
}

.flash-alert.warning .alert-icon {
  color: #f59e0b;
}

.flash-alert.success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.1));
  border: 2px solid #10b981;
}

.flash-alert.success .alert-icon {
  color: #10b981;
}

.alert-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-h, #333);
}

.alert-message {
  font-size: 13px;
  color: var(--text, #666);
  margin-top: 4px;
}

.alert-amount {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
}

.amount-label {
  font-size: 13px;
  color: var(--text, #666);
}

.amount-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-h, #333);
}

.amount-value.below {
  color: #ef4444;
  animation: amountFlash 0.8s ease-in-out infinite;
}

@keyframes amountFlash {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.amount-value.threshold {
  color: var(--text, #666);
  font-weight: 600;
}

.amount-separator {
  color: var(--border, #e0e0e0);
}

.btn-close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text, #666);
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-h, #333);
}

.flash-alert-enter-active {
  animation: slideIn 0.3s ease-out;
}

.flash-alert-leave-active {
  animation: slideOut 0.2s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}
</style>
