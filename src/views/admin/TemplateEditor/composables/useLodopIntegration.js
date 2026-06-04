import { ref } from 'vue'
import { message } from '../utils/message'

export default function useLodopIntegration() {
  const scriptLoaded = ref(false)
  const scriptLoading = ref(false)
  const loadError = ref('')
  const printerPort = ref(8000)

  const loadLodopScript = async () => {
    if (scriptLoaded.value) return Promise.resolve()
    
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
      throw error
    }
  }

  // 获取LODOP对象
  const getLodop = () => {
    if (typeof window.getLodop === 'function') {
      return window.getLodop()
    }
    if (typeof window.LODOP !== 'undefined') {
      return window.LODOP
    }
    throw new Error('LODOP对象未找到，请确保CLodop服务已启动')
  }

  // 预览模板
  const previewTemplate = async (template) => {
    try {
      // 确保脚本已加载
      if (!scriptLoaded.value) {
        await loadLodopScript()
      }
      
      const LODOP = getLodop()
      
      // 初始化打印任务
      LODOP.PRINT_INIT(`${template.name || '模板预览'}`)
      
      // 设置纸张大小
      const width = template.paperWidth || 210
      const height = template.paperHeight || 297
      LODOP.SET_PRINT_PAGESIZE(1, width * 10, height * 10, '')
      
      // 添加控件到打印任务
      if (template.controls && template.controls.length > 0) {
        template.controls.forEach((control, index) => {
          addControlToLodop(LODOP, control, index)
        })
      }
      
      // 打开预览窗口
      LODOP.PREVIEW()
      
    } catch (error) {
      console.error('预览失败:', error)
      message.error(error.message || '预览失败，请检查CLodop服务是否运行')
      throw error
    }
  }

  // 将控件添加到LODOP打印任务
  const addControlToLodop = (LODOP, control, index) => {
    const x = control.x || 0
    const y = control.y || 0
    const width = control.width || 100
    const height = control.height || 30
    
    switch (control.type) {
      case 'text':
        // 添加文本
        LODOP.ADD_PRINT_TEXT(y, x, width, height, control.text || '')
        // 设置文本样式
        if (control.fontSize) {
          LODOP.SET_PRINT_STYLEA(index + 1, 'FontSize', control.fontSize)
        }
        if (control.fontWeight === 'bold') {
          LODOP.SET_PRINT_STYLEA(index + 1, 'Bold', 1)
        }
        if (control.align) {
          const alignMap = {
            'left': 1,
            'center': 2,
            'right': 3
          }
          LODOP.SET_PRINT_STYLEA(index + 1, 'Alignment', alignMap[control.align] || 1)
        }
        break
        
      case 'data_text':
        // 添加数据文本（占位符）
        const placeholderText = control.placeholderText || ''
        const displayText = control.placeholderMode === 'prefix' 
          ? `${placeholderText}[数据]` 
          : `[数据]${placeholderText}`
        LODOP.ADD_PRINT_TEXT(y, x, width, height, displayText)
        if (control.fontSize) {
          LODOP.SET_PRINT_STYLEA(index + 1, 'FontSize', control.fontSize)
        }
        if (control.fontWeight === 'bold') {
          LODOP.SET_PRINT_STYLEA(index + 1, 'Bold', 1)
        }
        break
        
      case 'line':
        // 添加线条
        const borderWidth = control.borderWidth || 2
        LODOP.ADD_PRINT_LINE(y + height / 2, x, y + height / 2, x + width, borderWidth, 0)
        break
        
      case 'image':
        // 添加图片占位符
        const imageText = control.imageType === 'barcode' ? '条形码' : '二维码'
        LODOP.ADD_PRINT_TEXT(y, x, width, height, `[${imageText}]`)
        LODOP.SET_PRINT_STYLEA(index + 1, 'FontSize', 10)
        LODOP.SET_PRINT_STYLEA(index + 1, 'Alignment', 2)
        break
        
      default:
        // 默认添加文本
        LODOP.ADD_PRINT_TEXT(y, x, width, height, control.text || '')
    }
  }

  // 直接打印
  const printTemplate = async (template) => {
    try {
      if (!scriptLoaded.value) {
        await loadLodopScript()
      }
      
      const LODOP = getLodop()
      
      LODOP.PRINT_INIT(`${template.name || '模板打印'}`)
      
      const width = template.paperWidth || 210
      const height = template.paperHeight || 297
      LODOP.SET_PRINT_PAGESIZE(1, width * 10, height * 10, '')
      
      if (template.controls && template.controls.length > 0) {
        template.controls.forEach((control, index) => {
          addControlToLodop(LODOP, control, index)
        })
      }
      
      LODOP.PRINT()
      
    } catch (error) {
      console.error('打印失败:', error)
      message.error(error.message || '打印失败，请检查CLodop服务是否运行')
      throw error
    }
  }

  return {
    scriptLoaded,
    scriptLoading,
    loadError,
    printerPort,
    loadLodopScript,
    previewTemplate,
    printTemplate
  }
}