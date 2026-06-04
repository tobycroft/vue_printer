// 使用toast消息提示工具，替代alert
import toast from './toast'

export const message = {
  success: (msg) => {
    toast.success(msg)
    console.log('Success:', msg)
  },
  warning: (msg) => {
    toast.warning(msg)
    console.warn('Warning:', msg)
  },
  error: (msg) => {
    toast.error(msg)
    console.error('Error:', msg)
  },
  info: (msg) => {
    toast.info(msg)
    console.info('Info:', msg)
  }
}