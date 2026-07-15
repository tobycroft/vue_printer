import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { templateApi } from '../api/template'
import { message } from '../utils/message'

export default function useTemplateEditor(template, isEditing, router) {
  const selectedControl = ref(null)
  const loading = ref(false)
  const saving = ref(false)
  const userZoom = ref(1.0) // 用户手动设置的缩放
  const canvasWrapperRef = ref(null)
  const canvasSize = ref({ width: 800, height: 600 })
  
  // 更新画布尺寸
  const updateCanvasSize = () => {
    nextTick(() => {
      if (canvasWrapperRef.value) {
        const wrapper = canvasWrapperRef.value
        canvasSize.value = {
          width: wrapper.clientWidth,
          height: wrapper.clientHeight
        }
      }
    })
  }
  
  // 计算毫米到像素的转换比例，让纸张在画布中合适显示
  const calculateMmToPxRatio = () => {
    const paperWidth = template.paperWidth
    const paperHeight = template.paperHeight
    const isPortrait = paperHeight >= paperWidth // 判断是否是竖向纸张
    
    // 画布可用尺寸（80%的空间）
    const availableWidth = canvasSize.value.width * 0.8
    const availableHeight = canvasSize.value.height * 0.8
    
    let ratio
    
    if (isPortrait) {
      // 竖向纸张：以高度为基准，放大到屏幕高度的80%
      ratio = availableHeight / paperHeight
      // 确保宽度不超过画布宽度的80%
      const scaledWidth = paperWidth * ratio
      if (scaledWidth > availableWidth) {
        ratio = availableWidth / paperWidth
      }
    } else {
      // 横向纸张：以宽度为基准，放大到屏幕宽度的80%
      ratio = availableWidth / paperWidth
      // 确保高度不超过画布高度的80%
      const scaledHeight = paperHeight * ratio
      if (scaledHeight > availableHeight) {
        ratio = availableHeight / paperHeight
      }
    }
    
    // 限制最大和最小比例
    return Math.max(Math.min(ratio, 10.0), 0.1)
  }

  const paperStyle = computed(() => {
    const ratio = calculateMmToPxRatio() * userZoom.value
    
    return {
      width: `${template.paperWidth * ratio}px`,
      height: `${template.paperHeight * ratio}px`
    }
  })
  
  // 当前使用的毫米到像素转换比例
  const currentMmToPxRatio = computed(() => {
    return calculateMmToPxRatio() * userZoom.value
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
    return Math.round(userZoom.value * 100)
  })

  // 数据字段定义（基于抖店订单数据结构）
  const DATA_FIELDS = {
    shop_order_id: { name: '订单号', icon: '🔢' },
    order_status_text: { name: '订单状态', icon: '📋' },
    pay_type_desc: { name: '支付方式', icon: '💳' },
    create_time: { name: '下单时间', icon: '🕐' },
    pay_time: { name: '付款时间', icon: '🕑' },
    exp_ship_time: { name: '发货截止', icon: '⏰' },
    user_nickname: { name: '买家昵称', icon: '👤' },
    buyer_words: { name: '买家留言', icon: '💬' },
    remark: { name: '卖家备注', icon: '📝' },
    pay_amount: { name: '商品总额', icon: '💰' },
    post_amount: { name: '运费', icon: '🚚' },
    actual_pay_amount: { name: '实付金额', icon: '💵' },
    actual_receive_amount: { name: '商家收入', icon: '🏪' },
    post_receiver: { name: '收货人', icon: '🙋' },
    post_tel: { name: '联系电话', icon: '📞' },
    full_address: { name: '完整地址', icon: '📍' },
    province: { name: '省', icon: '🏛️' },
    city: { name: '市', icon: '🏙️' },
    town: { name: '区/县', icon: '🏘️' },
    street: { name: '街道', icon: '🛣️' },
    detail: { name: '详细地址', icon: '🏠' },
    product_name: { name: '商品名称', icon: '🏷️' },
    product_count: { name: '商品数量', icon: '📦' },
    product_pay_amount: { name: '商品单价', icon: '💲' },
    sku_specs: { name: 'SKU规格', icon: '📐' }
  }

  const availableWidgets = [
    { type: 'text', name: '固定文本', icon: '📝' },
    { type: 'data_text', name: '数据文本', icon: '📊' },
    { type: 'line', name: '线条', icon: '📏' },
    { type: 'image', name: '图片', icon: '🖼️' },
    { type: 'data_text', name: '订单号', icon: '🔢', dataField: 'shop_order_id', category: '订单信息' },
    { type: 'data_text', name: '订单状态', icon: '📋', dataField: 'order_status_text', category: '订单信息' },
    { type: 'data_text', name: '支付方式', icon: '💳', dataField: 'pay_type_desc', category: '订单信息' },
    { type: 'data_text', name: '下单时间', icon: '🕐', dataField: 'create_time', category: '订单信息' },
    { type: 'data_text', name: '付款时间', icon: '🕑', dataField: 'pay_time', category: '订单信息' },
    { type: 'data_text', name: '发货截止', icon: '⏰', dataField: 'exp_ship_time', category: '订单信息' },
    { type: 'data_text', name: '买家昵称', icon: '👤', dataField: 'user_nickname', category: '订单信息' },
    { type: 'data_text', name: '买家留言', icon: '💬', dataField: 'buyer_words', category: '订单信息' },
    { type: 'data_text', name: '卖家备注', icon: '📝', dataField: 'remark', category: '订单信息' },
    { type: 'data_text', name: '商品总额', icon: '💰', dataField: 'pay_amount', category: '金额信息' },
    { type: 'data_text', name: '运费', icon: '🚚', dataField: 'post_amount', category: '金额信息' },
    { type: 'data_text', name: '实付金额', icon: '💵', dataField: 'actual_pay_amount', category: '金额信息' },
    { type: 'data_text', name: '商家收入', icon: '🏪', dataField: 'actual_receive_amount', category: '金额信息' },
    { type: 'data_text', name: '收货人', icon: '🙋', dataField: 'post_receiver', category: '收货信息' },
    { type: 'data_text', name: '联系电话', icon: '📞', dataField: 'post_tel', category: '收货信息' },
    { type: 'data_text', name: '完整地址', icon: '📍', dataField: 'full_address', category: '收货信息' },
    { type: 'data_text', name: '省', icon: '🏛️', dataField: 'province', category: '收货信息' },
    { type: 'data_text', name: '市', icon: '🏙️', dataField: 'city', category: '收货信息' },
    { type: 'data_text', name: '区/县', icon: '🏘️', dataField: 'town', category: '收货信息' },
    { type: 'data_text', name: '街道', icon: '🛣️', dataField: 'street', category: '收货信息' },
    { type: 'data_text', name: '详细地址', icon: '🏠', dataField: 'detail', category: '收货信息' },
    { type: 'data_text', name: '商品名称', icon: '🏷️', dataField: 'product_name', category: '商品信息' },
    { type: 'data_text', name: '商品数量', icon: '📦', dataField: 'product_count', category: '商品信息' },
    { type: 'data_text', name: '商品单价', icon: '💲', dataField: 'product_pay_amount', category: '商品信息' },
    { type: 'data_text', name: 'SKU规格', icon: '📐', dataField: 'sku_specs', category: '商品信息' }
  ]

  const goBack = () => {
    router.push('/admin/templates')
  }

  const saveTemplate = async (saveControlsFn) => {
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

      let savedSuccessfully = false

      // 如果没有 id，先创建模板获取 id
      if (!template.id) {
        const createResult = await templateApi.createTemplate(templateData)
        if (createResult.code === 0) {
          template.id = createResult.data.id
          isEditing.value = true
          message.success('模板创建成功')
          savedSuccessfully = true
        } else {
          message.error(createResult.echo || '模板创建失败')
          return
        }
      } else {
        // 已有 id，直接更新
        const result = await templateApi.updateTemplate(template.id, templateData)
        if (result.code === 0) {
          message.success('模板保存成功')
          savedSuccessfully = true
        } else {
          message.error(result.echo || '模板保存失败')
          return
        }
      }

      // 只要保存成功，就调用 info/get 接口重新获取最新数据，并保存控件
      if (savedSuccessfully) {
        await loadTemplate(loadControlsFn)
        // 保存控件
        if (saveControlsFnInternal) {
          await saveControlsFnInternal()
        }
      }
    } catch (error) {
      message.error(error.message || '保存模板失败')
      console.error('Save template error:', error)
    } finally {
      saving.value = false
    }
  }

  const previewTemplate = async (lodopPreviewFn) => {
    // 预览模板逻辑
    console.log('Previewing template:', template)
    
    if (!template.controls || template.controls.length === 0) {
      message.warning('模板中没有控件，无法预览')
      return
    }
    
    if (typeof lodopPreviewFn === 'function') {
      try {
        await lodopPreviewFn(template)
      } catch (error) {
        console.error('预览失败:', error)
        message.error('预览失败: ' + (error.message || '未知错误'))
      }
    } else {
      message.info('预览功能未正确初始化')
    }
  }

  const updateTemplate = (updates) => {
    Object.assign(template, updates)
  }

  // 加载模板数据
  const loadTemplate = async (loadControlsFn) => {
    console.log('loadTemplate called, template.id:', template.id)
    if (!template.id) {
      console.log('No template.id, skipping load')
      return
    }

    loading.value = true
    try {
      console.log('Calling getTemplate with id:', template.id)
      const result = await templateApi.getTemplate(template.id)
      console.log('getTemplate result:', result)
      // go_printer返回的格式是{code:0, data:[], echo:''}
      if (result.code === 0) {
        // 转换后端返回的数据格式
        template.name = result.data.template_name
        template.paperWidth = result.data.width
        template.paperHeight = result.data.height
        console.log('Template data filled:', template)
        // 如果有预设尺寸，可以在这里设置
        // template.presetSize = result.data.preset_size
        
        // 加载控件
        if (loadControlsFn) {
          await loadControlsFn()
        }
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

  let loadControlsFn = null

  const setLoadControlsFn = (fn) => {
    loadControlsFn = fn
  }

  let saveControlsFnInternal = null

  const setSaveControlsFn = (fn) => {
    saveControlsFnInternal = fn
  }

  onMounted(() => {
    console.log('useTemplateEditor onMounted, template.id:', template.id)
    updateCanvasSize()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateCanvasSize)
  })

  // 监听模板 id 变化，只要有 id 就加载数据（包括初始值）
  watch(() => template.id, (newId) => {
    console.log('watch template.id changed, newId:', newId)
    if (newId) {
      loadTemplate(loadControlsFn)
    }
  }, { immediate: true })
  
  // 清理事件监听
  const handleUnmount = () => {
    window.removeEventListener('resize', updateCanvasSize)
  }

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
    currentMmToPxRatio,
    canvasWrapperRef,
    selectedControl,
    availableWidgets,
    DATA_FIELDS,
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
    deleteSelectedControl,
    handleUnmount,
    setLoadControlsFn,
    setSaveControlsFn,
    loadTemplate
  }
}