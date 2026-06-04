import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { templateDetailApi } from '../api/template'
import { message } from '../utils/message'

export default function useControlOperations(template, selectedControl, mmToPxRatio) {
  const draggedWidget = ref(null)
  const draggingControl = ref(null)
  const dragOffset = reactive({ x: 0, y: 0 })
  const controlsLoading = ref(false)
  
  // 调整大小相关状态
  const resizingControl = ref(null)
  const resizeDirection = ref('')
  const resizeStartData = reactive({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    startX: 0,
    startY: 0
  })
  
  // 防抖定时器
  let updateDebounceTimer = null
  let pendingUpdateControl = null
  
  // 拖动性能优化相关
  let dragAnimationFrame = null
  let dragTargetElement = null
  let dragStartX = 0
  let dragStartY = 0
  let dragCurrentX = 0
  let dragCurrentY = 0
  
  // 调整大小性能优化相关
  let resizeAnimationFrame = null
  let resizeTargetElement = null
  let resizeStartX = 0
  let resizeStartY = 0
  let resizeCurrentX = 0
  let resizeCurrentY = 0
  let resizeCurrentWidth = 0
  let resizeCurrentHeight = 0

  // 将后端返回的控件数据转换为前端格式
  const convertControlFromBackend = (backendControl) => {
    const baseData = {
      id: backendControl.id,
      type: backendControl.type,
      x: backendControl.x,
      y: backendControl.y,
      width: backendControl.width,
      height: backendControl.height
    }

    switch (backendControl.type) {
      case 'text':
        return {
          ...baseData,
          text: backendControl.content || '',
          fontSize: backendControl.font_size || 14,
          fontWeight: backendControl.font_weight || 'normal',
          align: backendControl.align || 'left'
        }
      case 'data_text':
        return {
          ...baseData,
          placeholderMode: 'prefix',
          placeholderText: backendControl.content || '',
          fontSize: backendControl.font_size || 14,
          fontWeight: backendControl.font_weight || 'normal',
          align: backendControl.align || 'left'
        }
      case 'line':
        return {
          ...baseData,
          borderWidth: 2
        }
      case 'image':
        return {
          ...baseData,
          imageType: 'barcode'
        }
      default:
        return baseData
    }
  }

  // 将前端控件数据转换为后端格式
  const convertControlToBackend = (control) => {
    let content = ''
    switch (control.type) {
      case 'text':
        content = control.text || ''
        break
      case 'data_text':
        content = control.placeholderText || ''
        break
      default:
        content = ''
    }

    return {
      template_id: template.id,
      type: control.type,
      tag: control.type, // 使用 type 作为 tag
      content: content,
      font_size: control.fontSize || 14,
      font_weight: control.fontWeight || 'normal',
      align: control.align || 'left',
      width: control.width,
      height: control.height,
      x: control.x,
      y: control.y
    }
  }

  // 加载模板控件
  const loadControls = async () => {
    if (!template.id) return

    controlsLoading.value = true
    try {
      console.log('Loading controls for template:', template.id)
      const result = await templateDetailApi.getTemplateDetails(template.id)
      console.log('Controls loaded:', result)
      
      if (result.code === 0) {
        // 清空现有控件
        template.controls.splice(0, template.controls.length)
        
        // 添加加载的控件
        if (Array.isArray(result.data)) {
          result.data.forEach(backendControl => {
            const frontendControl = convertControlFromBackend(backendControl)
            template.controls.push(frontendControl)
          })
        }
      } else {
        message.error(result.echo || '加载控件失败')
      }
    } catch (error) {
      message.error(error.message || '加载控件失败')
      console.error('Load controls error:', error)
    } finally {
      controlsLoading.value = false
    }
  }

  const onDragStart = (event, widget) => {
    draggedWidget.value = widget
    event.dataTransfer.effectAllowed = 'copy'
  }

  let isProcessingDrop = false

  const onDrop = async (event) => {
    event.preventDefault()
    
    // 防止重复处理
    if (isProcessingDrop) {
      console.log('Drop already processing, ignoring duplicate')
      return
    }
    
    if (!draggedWidget.value) return
    if (!template.id) {
      message.warning('请先保存模板，再添加控件')
      return
    }

    isProcessingDrop = true

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // 转换为实际纸张坐标（mm）
    const ratio = mmToPxRatio.value || 3.78
    const actualX = Math.round(x / ratio)
    const actualY = Math.round(y / ratio)

    // 创建临时控件（不添加到本地，直接调用API）
    const tempControl = createLocalControl(draggedWidget.value.type, actualX, actualY)
    
    // 调用后端添加接口
    controlsLoading.value = true
    try {
      const backendData = convertControlToBackend(tempControl)
      const result = await templateDetailApi.addTemplateDetail(backendData)
      
      if (result.code === 0) {
        // 直接使用返回的 id，不重新加载
        const newControl = {
          ...tempControl,
          id: result.data.id
        }
        template.controls.push(newControl)
        selectedControl.value = newControl
        message.success('控件添加成功')
      } else {
        message.error(result.echo || '添加控件失败')
      }
    } catch (error) {
      message.error(error.message || '添加控件失败')
      console.error('Add control error:', error)
    } finally {
      controlsLoading.value = false
      isProcessingDrop = false
      draggedWidget.value = null
    }
  }

  const onPaperClick = () => {
    selectedControl.value = null
  }

  const startDragControl = (event, control) => {
    selectedControl.value = control
    draggingControl.value = control
    
    // 获取控件对应的 DOM 元素
    dragTargetElement = event.currentTarget
    
    // 添加 dragging 类，提升性能
    if (dragTargetElement) {
      dragTargetElement.classList.add('dragging')
    }
    
    // 记录初始鼠标位置和控件位置
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragCurrentX = control.x
    dragCurrentY = control.y
    
    document.addEventListener('mousemove', onDragControl, { passive: true })
    document.addEventListener('mouseup', stopDragControl)
  }

  const onDragControl = (event) => {
    if (!draggingControl.value || !dragTargetElement) return

    // 计算鼠标移动的距离（像素）
    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY
    
    // 使用 transform 进行移动，性能更好
    // 直接使用像素偏移，不需要转换
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame)
    }
    
    dragAnimationFrame = requestAnimationFrame(() => {
      if (dragTargetElement) {
        // 使用 translate3d 启用 GPU 加速
        dragTargetElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`
      }
    })
  }

  const stopDragControl = () => {
    // 取消未执行的动画帧
    if (dragAnimationFrame) {
      cancelAnimationFrame(dragAnimationFrame)
      dragAnimationFrame = null
    }
    
    if (draggingControl.value && dragTargetElement) {
      // 移除 dragging 类
      dragTargetElement.classList.remove('dragging')
      
      // 计算最终位置
      const transform = dragTargetElement.style.transform
      const match = transform.match(/translate3d\(([^,]+)px,\s*([^,]+)px/)
      if (match) {
        const deltaX = parseFloat(match[1])
        const deltaY = parseFloat(match[2])
        const ratio = mmToPxRatio.value || 3.78
        
        // 更新响应式数据
        const finalX = Math.max(0, Math.round(dragCurrentX + deltaX / ratio))
        const finalY = Math.max(0, Math.round(dragCurrentY + deltaY / ratio))
        draggingControl.value.x = finalX
        draggingControl.value.y = finalY
        
        // 清除 transform，恢复为 left/top 定位
        dragTargetElement.style.transform = ''
        dragTargetElement.style.left = `${finalX * ratio}px`
        dragTargetElement.style.top = `${finalY * ratio}px`
      }
      
      // 拖动结束后，使用防抖更新（非阻塞）
      debouncedUpdateControl(draggingControl.value)
    }
    
    draggingControl.value = null
    dragTargetElement = null
    document.removeEventListener('mousemove', onDragControl)
    document.removeEventListener('mouseup', stopDragControl)
  }

  // 开始调整大小
  const startResizeControl = (event, control, direction) => {
    resizingControl.value = control
    resizeDirection.value = direction
    
    // 获取控件对应的 DOM 元素（从事件目标向上查找 control-item）
    resizeTargetElement = event.target.closest('.control-item')
    if (resizeTargetElement) {
      resizeTargetElement.classList.add('dragging')
    }
    
    // 记录初始状态
    resizeStartX = event.clientX
    resizeStartY = event.clientY
    resizeCurrentX = control.x
    resizeCurrentY = control.y
    resizeCurrentWidth = control.width
    resizeCurrentHeight = control.height
    
    document.addEventListener('mousemove', onResizeControl, { passive: true })
    document.addEventListener('mouseup', stopResizeControl)
  }

  // 调整大小
  const onResizeControl = (event) => {
    if (!resizingControl.value || !resizeTargetElement) return
    
    // 计算鼠标移动的像素距离
    const deltaX = event.clientX - resizeStartX
    const deltaY = event.clientY - resizeStartY
    
    const dir = resizeDirection.value
    const ratio = mmToPxRatio.value || 3.78
    
    // 计算新的尺寸（mm）
    let newX = resizeCurrentX
    let newY = resizeCurrentY
    let newWidth = resizeCurrentWidth
    let newHeight = resizeCurrentHeight
    
    const deltaXmm = deltaX / ratio
    const deltaYmm = deltaY / ratio
    
    // 根据方向调整大小，确保结果为整数
    if (dir.includes('w')) {
      newX = Math.max(0, Math.round(resizeCurrentX + deltaXmm))
      newWidth = Math.max(10, Math.round(resizeCurrentWidth - deltaXmm))
    }
    if (dir.includes('e')) {
      newWidth = Math.max(10, Math.round(resizeCurrentWidth + deltaXmm))
    }
    if (dir.includes('n')) {
      newY = Math.max(0, Math.round(resizeCurrentY + deltaYmm))
      newHeight = Math.max(5, Math.round(resizeCurrentHeight - deltaYmm))
    }
    if (dir.includes('s')) {
      newHeight = Math.max(5, Math.round(resizeCurrentHeight + deltaYmm))
    }
    
    // 使用 requestAnimationFrame 进行 DOM 更新
    if (resizeAnimationFrame) {
      cancelAnimationFrame(resizeAnimationFrame)
    }
    
    resizeAnimationFrame = requestAnimationFrame(() => {
      if (resizeTargetElement) {
        // 直接操作 DOM，不触发 Vue 的响应式更新
        resizeTargetElement.style.left = `${newX * ratio}px`
        resizeTargetElement.style.top = `${newY * ratio}px`
        resizeTargetElement.style.width = `${newWidth * ratio}px`
        resizeTargetElement.style.height = `${newHeight * ratio}px`
      }
    })
  }

  // 停止调整大小
  const stopResizeControl = () => {
    // 取消未执行的动画帧
    if (resizeAnimationFrame) {
      cancelAnimationFrame(resizeAnimationFrame)
      resizeAnimationFrame = null
    }
    
    if (resizingControl.value && resizeTargetElement) {
      // 移除 dragging 类
      resizeTargetElement.classList.remove('dragging')
      
      // 从 DOM 读取最终尺寸
      const finalLeft = parseFloat(resizeTargetElement.style.left) || 0
      const finalTop = parseFloat(resizeTargetElement.style.top) || 0
      const finalWidth = parseFloat(resizeTargetElement.style.width) || 0
      const finalHeight = parseFloat(resizeTargetElement.style.height) || 0
      
      const ratio = mmToPxRatio.value || 3.78
      
      // 更新响应式数据
      resizingControl.value.x = Math.round(finalLeft / ratio)
      resizingControl.value.y = Math.round(finalTop / ratio)
      resizingControl.value.width = Math.round(finalWidth / ratio)
      resizingControl.value.height = Math.round(finalHeight / ratio)
      
      // 调整大小结束后，使用防抖更新
      debouncedUpdateControl(resizingControl.value)
    }
    
    resizingControl.value = null
    resizeTargetElement = null
    document.removeEventListener('mousemove', onResizeControl)
    document.removeEventListener('mouseup', stopResizeControl)
  }

  const watchControlUpdates = (control) => {
    // 控件更新时，使用防抖调用 API
    debouncedUpdateControl(control)
  }

  // 防抖更新控件 - 非阻塞，立即返回
  const debouncedUpdateControl = (control) => {
    if (!control.id || !template.id) return
    
    // 如果是临时 ID，不更新
    if (typeof control.id === 'number' && control.id.toString().length > 10) {
      return
    }
    
    // 保存最新的控件数据
    pendingUpdateControl = { ...control }
    
    // 清除之前的定时器
    if (updateDebounceTimer) {
      clearTimeout(updateDebounceTimer)
    }
    
    // 设置新的定时器，300ms 后执行更新
    updateDebounceTimer = setTimeout(() => {
      executeUpdateControl(pendingUpdateControl)
      updateDebounceTimer = null
      pendingUpdateControl = null
    }, 300)
  }
  
  // 立即执行更新（用于需要同步的场景）
  const executeUpdateControl = async (control) => {
    if (!control || !control.id || !template.id) return
    
    try {
      const backendData = convertControlToBackend(control)
      const result = await templateDetailApi.updateTemplateDetail(control.id, backendData)
      
      if (result.code !== 0) {
        message.error(result.echo || '更新控件失败')
      }
    } catch (error) {
      console.error('Update control error:', error)
    }
  }
  
  // 同步更新控件（用于需要立即保存的场景）
  const updateControl = async (control) => {
    // 先清除防抖定时器
    if (updateDebounceTimer) {
      clearTimeout(updateDebounceTimer)
      updateDebounceTimer = null
    }
    pendingUpdateControl = null
    
    // 立即执行更新
    await executeUpdateControl(control)
  }

  // 计算控件默认尺寸（基于纸张大小）
  const getDefaultControlSize = (type) => {
    // 获取纸张尺寸（mm）
    const paperWidth = template.paperWidth || 210
    const paperHeight = template.paperHeight || 297
    
    // 计算比例因子（基于 A4 纸张 210x297 作为基准）
    const widthRatio = paperWidth / 210
    const heightRatio = paperHeight / 297
    const avgRatio = (widthRatio + heightRatio) / 2
    
    // 根据控件类型和纸张大小计算合适的默认尺寸
    switch (type) {
      case 'text':
        return {
          width: Math.round(Math.min(100 * widthRatio, paperWidth * 0.4)), // 最大占纸张宽度的 40%
          height: Math.round(Math.min(30 * heightRatio, paperHeight * 0.08)) // 最大占纸张高度的 8%
        }
      case 'data_text':
        return {
          width: Math.round(Math.min(120 * widthRatio, paperWidth * 0.5)),
          height: Math.round(Math.min(30 * heightRatio, paperHeight * 0.08))
        }
      case 'line':
        return {
          width: Math.round(Math.min(150 * widthRatio, paperWidth * 0.6)),
          height: Math.max(2, Math.round(2 * avgRatio))
        }
      case 'image':
        return {
          width: Math.round(Math.min(80 * widthRatio, paperWidth * 0.3)),
          height: Math.round(Math.min(60 * heightRatio, paperHeight * 0.15))
        }
      default:
        return {
          width: Math.round(80 * widthRatio),
          height: Math.round(30 * heightRatio)
        }
    }
  }

  // 创建本地控件数据
  const createLocalControl = (type, x, y) => {
    // 获取基于纸张大小的默认尺寸
    const defaultSize = getDefaultControlSize(type)
    
    const baseData = {
      id: Date.now(), // 使用时间戳作为临时 ID
      type,
      x,
      y,
      width: defaultSize.width,
      height: defaultSize.height
    }

    switch (type) {
      case 'text':
        return {
          ...baseData,
          text: '新文本',
          fontSize: 14,
          fontWeight: 'normal',
          align: 'left'
        }
      case 'data_text':
        return {
          ...baseData,
          placeholderMode: 'prefix',
          placeholderText: '',
          fontSize: 14,
          fontWeight: 'normal',
          align: 'left'
        }
      case 'line':
        return {
          ...baseData,
          borderWidth: 2
        }
      case 'image':
        return {
          ...baseData,
          imageType: 'barcode'
        }
      default:
        return baseData
    }
  }

  // 删除控件
  const deleteControl = async (controlId) => {
    if (!template.id) return
    
    // 正式 ID，先调用后端删除接口
    controlsLoading.value = true
    try {
      const result = await templateDetailApi.deleteTemplateDetail(controlId)
      
      if (result.code === 0) {
        // 删除成功，直接从本地删除
        const index = template.controls.findIndex(c => c.id === controlId)
        if (index !== -1) {
          template.controls.splice(index, 1)
          if (selectedControl.value?.id === controlId) {
            selectedControl.value = null
          }
        }
        message.success('控件删除成功')
      } else {
        message.error(result.echo || '删除控件失败')
      }
    } catch (error) {
      message.error(error.message || '删除控件失败')
      console.error('Delete control error:', error)
    } finally {
      controlsLoading.value = false
    }
  }

  // 键盘事件处理
  const handleKeyDown = (event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedControl.value) {
        deleteControl(selectedControl.value.id)
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    onDragStart,
    onDrop,
    onPaperClick,
    startDragControl,
    startResizeControl,
    watchControlUpdates,
    controlsLoading,
    deleteControl,
    loadControls,
    // 保持 saveControls 导出以兼容外部调用
    saveControls: async () => {
      console.log('saveControls is deprecated, controls are saved in real-time')
    }
  }
}
