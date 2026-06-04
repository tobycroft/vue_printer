import { ref, reactive, watch, onMounted } from 'vue'
import { templateDetailApi } from '../api/template'
import { message } from '../utils/message'

export default function useControlOperations(template, selectedControl) {
  const draggedWidget = ref(null)
  const draggingControl = ref(null)
  const dragOffset = reactive({ x: 0, y: 0 })
  const controlsLoading = ref(false)
  
  // 标记控件是否被用户手动调整过大小
  const manuallyResizedControls = ref(new Set())

  const onDragStart = (event, widget) => {
    draggedWidget.value = widget
    event.dataTransfer.effectAllowed = 'copy'
  }

  const onDrop = async (event) => {
    event.preventDefault()
    
    if (!draggedWidget.value) return
    if (!template.id) {
      message.warning('请先保存模板，再添加控件')
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // 转换为实际纸张坐标
    const scale = 0.8 // 与paperStyle中的scale对应
    const actualX = Math.round(x / scale)
    const actualY = Math.round(y / scale)

    try {
        const controlData = createControlData(draggedWidget.value.type, actualX, actualY)
        controlData.template_id = template.id
        
        const result = await templateDetailApi.addTemplateDetail(controlData)
        
        // go_printer返回的格式是{code:0, data:[], echo:''}
        if (result.code === 0) {
          const newControl = mapApiControlToLocal(result.data)
          template.controls.push(newControl)
          message.success('控件添加成功')
        } else {
          message.error(result.echo || '添加控件失败')
        }
      } catch (error) {
      message.error(error.message || '添加控件失败')
      console.error('Add control error:', error)
    } finally {
      draggedWidget.value = null
    }
  }

  const onPaperClick = () => {
    selectedControl.value = null
  }

  const startDragControl = (event, control) => {
    selectedControl.value = control
    draggingControl.value = control
    
    const rect = event.currentTarget.getBoundingClientRect()
    dragOffset.x = event.clientX - rect.left
    dragOffset.y = event.clientY - rect.top
    
    document.addEventListener('mousemove', onDragControl)
    document.addEventListener('mouseup', stopDragControl)
  }

  const onDragControl = (event) => {
    if (!draggingControl.value || !event.currentTarget) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - dragOffset.x
    const y = event.clientY - rect.top - dragOffset.y
    
    // 转换为实际纸张坐标
    const scale = 0.8
    const actualX = Math.round(x / scale)
    const actualY = Math.round(y / scale)

    draggingControl.value.x = Math.max(0, actualX)
    draggingControl.value.y = Math.max(0, actualY)
  }

  const stopDragControl = () => {
    draggingControl.value = null
    document.removeEventListener('mousemove', onDragControl)
    document.removeEventListener('mouseup', stopDragControl)
  }

  const watchControlUpdates = async (control) => {
    if (!control.id) return
    
    try {
      // 准备更新数据
      const updateData = mapLocalControlToApi(control)
      await templateDetailApi.updateTemplateDetail(control.id, updateData)
      console.log('Control updated:', control)
    } catch (error) {
      console.error('Update control error:', error)
      // 不在这里显示错误提示，避免频繁弹窗
    }
  }

  // 创建用于API的控件数据
  const createControlData = (type, x, y) => {
    const baseData = {
      type,
      x,
      y,
      width: 100,
      height: 30,
      tag: '',
      content: ''
    }

    switch (type) {
      case 'text':
        return {
          ...baseData,
          content: '新文本',
          font_size: 14,
          font_weight: 'normal',
          align: 'left'
        }
      case 'data_text':
        return {
          ...baseData,
          content: '[数据文本]',
          font_size: 14,
          font_weight: 'normal',
          align: 'left'
        }
      case 'line':
        return {
          ...baseData,
          width: 200,
          height: 2
        }
      case 'image':
        return {
          ...baseData,
          width: 150,
          height: 50,
          content: 'barcode'
        }
      default:
        return baseData
    }
  }

  // 转换API返回的控件数据到本地格式
  const mapApiControlToLocal = (apiControl) => {
    const baseControl = {
      id: apiControl.id,
      type: apiControl.type,
      x: apiControl.x,
      y: apiControl.y,
      width: apiControl.width,
      height: apiControl.height
    }

    switch (apiControl.type) {
      case 'text':
        return {
          ...baseControl,
          text: apiControl.content,
          fontSize: apiControl.font_size,
          fontWeight: apiControl.font_weight,
          align: apiControl.align
        }
      case 'data_text':
        // 解析占位文本和数据文本
        const content = apiControl.content || '[数据文本]'
        let placeholderMode = 'prefix'
        let placeholderText = ''
        
        if (content.includes('[数据文本]')) {
          if (content.startsWith('[数据文本]')) {
            placeholderMode = 'suffix'
            placeholderText = content.replace('[数据文本]', '').trim()
          } else {
            placeholderMode = 'prefix'
            placeholderText = content.replace('[数据文本]', '').trim()
          }
        }
        
        return {
          ...baseControl,
          placeholderMode,
          placeholderText,
          fontSize: apiControl.font_size,
          fontWeight: apiControl.font_weight,
          align: apiControl.align
        }
      case 'line':
        return {
          ...baseControl,
          borderWidth: 2 // 可以从API获取
        }
      case 'image':
        return {
          ...baseControl,
          imageType: apiControl.content || 'barcode'
        }
      default:
        return baseControl
    }
  }

  // 转换本地控件数据到API格式
  const mapLocalControlToApi = (localControl) => {
    const baseData = {
      type: localControl.type,
      x: localControl.x,
      y: localControl.y,
      width: localControl.width,
      height: localControl.height
    }

    switch (localControl.type) {
      case 'text':
        return {
          ...baseData,
          content: localControl.text,
          font_size: localControl.fontSize,
          font_weight: localControl.fontWeight,
          align: localControl.align
        }
      case 'data_text':
        let content = ''
        if (localControl.placeholderMode === 'prefix') {
          content = `${localControl.placeholderText || ''}[数据文本]`
        } else {
          content = `[数据文本]${localControl.placeholderText || ''}`
        }
        return {
          ...baseData,
          content,
          font_size: localControl.fontSize,
          font_weight: localControl.fontWeight,
          align: localControl.align
        }
      case 'line':
        return baseData
      case 'image':
        return {
          ...baseData,
          content: localControl.imageType
        }
      default:
        return baseData
    }
  }

  // 加载模板控件
  const loadTemplateControls = async () => {
    if (!template.id) return
    
    controlsLoading.value = true
    try {
        const result = await templateDetailApi.getTemplateDetails(template.id)
        // go_printer返回的格式是{code:0, data:[], echo:''}
        if (result.code === 0) {
          template.controls = result.data.map(mapApiControlToLocal)
        } else {
          message.error(result.echo || '加载控件失败')
        }
      } catch (error) {
        message.error(error.message || '加载控件失败')
        console.error('Load controls error:', error)
      } finally {
        loadingControls.value = false
      }
    }
  
  // 删除控件
  const deleteControl = async (controlId) => {
    try {
        const result = await templateDetailApi.deleteTemplateDetail(controlId)
        // go_printer返回的格式是{code:0, data:[], echo:''}
        if (result.code === 0) {
          message.success('控件删除成功')
        } else {
          message.error(result.echo || '删除控件失败')
        }
      } catch (error) {
        message.error(error.message || '删除控件失败')
        console.error('Delete control error:', error)
      }
  }

  onMounted(() => {
    // 如果是编辑模式，加载已有控件
    if (template.id) {
      loadTemplateControls()
    }
  })

  // 监听模板ID变化，加载控件
  watch(() => template.id, () => {
    if (template.id) {
      loadTemplateControls()
    }
  })

  return {
    onDragStart,
    onDrop,
    onPaperClick,
    startDragControl,
    watchControlUpdates,
    controlsLoading,
    deleteControl
  }
}