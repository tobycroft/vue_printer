import { ref, computed, watch, onMounted } from 'vue'
import { templateApi } from '../api/template'
import { message } from '../utils/message'

export default function useTemplateEditor(template, isEditing, router) {
  const selectedControl = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const zoom = ref(1.0) // 默认缩放比例
  const userZoom = ref(1.0) // 用户手动设置的缩放
  
  // 计算基础缩放比例，让纸张在画布中合适显示
  const calculateBaseScale = () => {
    const maxWidth = 400 // 画布最大显示宽度（像素）
    const maxHeight = 400 // 画布最大显示高度（像素）
    const paperWidth = template.paperWidth
    const paperHeight = template.paperHeight
    
    // 计算让纸张在画布中合适显示的基础缩放
    const scaleX = maxWidth / paperWidth
    const scaleY = maxHeight / paperHeight
    const baseScale = Math.min(scaleX, scaleY, 3.0) // 最大不超过3倍
    
    return Math.max(baseScale, 0.3) // 最小0.3倍
  }

  const paperStyle = computed(() => {
    const baseScale = calculateBaseScale()
    const scale = baseScale * userZoom.value
    
    return {
      width: `${template.paperWidth}mm`,
      height: `${template.paperHeight}mm`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center'
    }
  })

  // 缩放控制函数
  const setZoom = (newZoom) => {
    if (newZoom >= 0.3 && newZoom <= 3.0) {
      userZoom.value = newZoom
    }
  }

  const zoomIn = () => {
    setZoom(userZoom.value + 0.25)
  }

  const zoomOut = () => {
    setZoom(userZoom.value - 0.25)
  }

  const resetZoom = () => {
    userZoom.value = 1.0
  }
  
  // 计算当前显示的缩放百分比
  const currentZoomPercent = computed(() => {
    const baseScale = calculateBaseScale()
    return Math.round(baseScale * userZoom.value * 100)
  })

  const availableWidgets = [
    { type: 'text', name: '固定文本', icon: '📝' },
    { type: 'data_text', name: '数据文本', icon: '📊' },
    { type: 'line', name: '线条', icon: '📏' },
    { type: 'image', name: '图片', icon: '🖼️' }
  ]

  const goBack = () => {
    router.push('/admin/templates')
  }

  const saveTemplate = async () => {
    if (!template.name.trim()) {
      message.warning('请输入模板名称')
      return
    }

    saving.value = true
    try {
      const templateData = {
        template_name: template.name,
        width: template.paperWidth,
        height: template.paperHeight,
        preset_size: '' // 可以根据需要添加预设尺寸
      }

      if (isEditing.value) {
        // 更新模板
        const result = await templateApi.updateTemplate(template.id, templateData)
        // go_printer返回的格式是{code:0, data:[], echo:''}
        if (result.code === 0) {
          message.success('模板更新成功')
        } else {
          message.error(result.echo || '模板更新失败')
        }
      } else {
        // 创建模板
        const result = await templateApi.createTemplate(templateData)
        if (result.code === 0) {
          template.id = result.data.id // 保存返回的模板ID
          isEditing.value = true
          message.success('模板创建成功')
        } else {
          message.error(result.echo || '模板创建失败')
        }
      }
    } catch (error) {
      message.error(error.message || '保存模板失败')
      console.error('Save template error:', error)
    } finally {
      saving.value = false
    }
  }

  const previewTemplate = () => {
    // 预览模板逻辑
    console.log('Previewing template:', template)
    message.info('预览功能开发中...')
  }

  const updateTemplate = (updates) => {
    Object.assign(template, updates)
  }

  // 加载模板数据
  const loadTemplate = async () => {
    if (!isEditing.value || !template.id) return

    loading.value = true
    try {
      const result = await templateApi.getTemplate(template.id)
      // go_printer返回的格式是{code:0, data:[], echo:''}
      if (result.code === 0) {
        // 转换后端返回的数据格式
        template.name = result.data.template_name
        template.paperWidth = result.data.width
        template.paperHeight = result.data.height
        // 如果有预设尺寸，可以在这里设置
        // template.presetSize = result.data.preset_size
      } else {
        message.error(result.echo || '加载模板失败')
      }
    } catch (error) {
      message.error(error.message || '加载模板失败')
      console.error('Load template error:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadTemplate()
  })

  const selectControl = (control) => {
    selectedControl.value = control
  }

  const deleteSelectedControl = () => {
    if (selectedControl.value) {
      const index = template.controls.findIndex(
        c => c.id === selectedControl.value.id
      )
      if (index !== -1) {
        template.controls.splice(index, 1)
        selectedControl.value = null
      }
    }
  }

  return {
    paperStyle,
    selectedControl,
    availableWidgets,
    loading,
    saving,
    currentZoomPercent,
    zoomIn,
    zoomOut,
    resetZoom,
    goBack,
    saveTemplate,
    previewTemplate,
    updateTemplate,
    selectControl,
    deleteSelectedControl
  }
}