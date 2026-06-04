import { createApp, h } from 'vue'
import Toast from '../components/Toast.vue'

// 创建toast实例
function createToast(message, type = 'info', duration = 3000) {
  // 创建容器
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // 创建应用
  const app = createApp({
    render() {
      return h(Toast, {
        message,
        type,
        duration
      })
    }
  })
  
  // 挂载应用
  app.mount(container)
  
  // 自动销毁
  setTimeout(() => {
    app.unmount()
    document.body.removeChild(container)
  }, duration + 300)
}

// 导出toast方法
const toast = {
  success: (message, duration = 3000) => {
    createToast(message, 'success', duration)
  },
  
  error: (message, duration = 3000) => {
    createToast(message, 'error', duration)
  },
  
  warning: (message, duration = 3000) => {
    createToast(message, 'warning', duration)
  },
  
  info: (message, duration = 3000) => {
    createToast(message, 'info', duration)
  }
}

export default toast