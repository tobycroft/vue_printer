import { ref } from 'vue'

export default function useLodopIntegration() {
  const scriptLoaded = ref(false)
  const scriptLoading = ref(false)
  const loadError = ref('')
  const printerPort = ref(8000)

  const loadLodopScript = async () => {
    scriptLoading.value = true
    loadError.value = ''
    
    try {
      const scriptUrl = `http://127.0.0.1:${printerPort.value}/CLodopfuncs.js`
      
      // 创建script标签
      const script = document.createElement('script')
      script.src = scriptUrl
      script.type = 'text/javascript'
      
      return new Promise((resolve, reject) => {
        script.onload = () => {
          scriptLoaded.value = true
          scriptLoading.value = false
          resolve()
        }
        
        script.onerror = () => {
          scriptLoaded.value = false
          scriptLoading.value = false
          loadError.value = '打印控件加载失败，请检查Lodop服务是否运行'
          reject(new Error('Lodop script load failed'))
        }
        
        document.head.appendChild(script)
      })
    } catch (error) {
      scriptLoaded.value = false
      scriptLoading.value = false
      loadError.value = '打印控件加载失败: ' + error.message
      console.error('Failed to load Lodop script:', error)
    }
  }

  return {
    scriptLoaded,
    scriptLoading,
    loadError,
    printerPort,
    loadLodopScript
  }
}