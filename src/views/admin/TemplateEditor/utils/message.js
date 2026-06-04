// 简单的消息提示工具，替代Element Plus的ElMessage
export const message = {
  success: (msg) => {
    alert(`成功: ${msg}`)
    console.log('Success:', msg)
  },
  warning: (msg) => {
    alert(`警告: ${msg}`)
    console.warn('Warning:', msg)
  },
  error: (msg) => {
    alert(`错误: ${msg}`)
    console.error('Error:', msg)
  },
  info: (msg) => {
    alert(`提示: ${msg}`)
    console.info('Info:', msg)
  }
}