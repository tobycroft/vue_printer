<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast-container" :class="type">
      <div class="toast-content">
        <span class="toast-icon">{{ getIcon() }}</span>
        <span class="toast-text">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => {
      return ['success', 'error', 'warning', 'info'].includes(value)
    }
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const visible = ref(false)
let timer = null

const show = () => {
  visible.value = true
  if (timer) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    hide()
  }, props.duration)
}

const hide = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

const getIcon = () => {
  switch (props.type) {
    case 'success':
      return '✓'
    case 'error':
      return '✗'
    case 'warning':
      return '⚠'
    case 'info':
    default:
      return 'ℹ'
  }
}

onMounted(() => {
  show()
})

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  padding: 12px 16px;
  border-radius: 6px;
  background-color: #333;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
}

.toast-container.success {
  background-color: #67c23a;
}

.toast-container.error {
  background-color: #f56c6c;
}

.toast-container.warning {
  background-color: #e6a23c;
}

.toast-container.info {
  background-color: #409eff;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
}

.toast-text {
  font-size: 14px;
  line-height: 1.4;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>