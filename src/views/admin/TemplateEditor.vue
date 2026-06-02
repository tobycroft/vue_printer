<template>
  <div class="template-editor-container">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn btn-secondary back-btn" @click="goBack">
          ← 返回列表
        </button>
        <h2>{{ isEditing ? '编辑模板' : '新建模板' }}</h2>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="previewTemplate">预览</button>
        <button class="btn btn-primary" @click="saveTemplate">保存模板</button>
      </div>
    </header>

    <div class="editor-main">
      <aside class="editor-sidebar">
        <div class="section">
          <h3>纸张设置</h3>
          <div class="form-group">
            <label>模板名称</label>
            <input v-model="currentTemplate.name" type="text" placeholder="请输入模板名称" class="form-control" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>宽度 (mm)</label>
              <input v-model.number="currentTemplate.paperWidth" type="number" min="10" max="1000" class="form-control" />
            </div>
            <div class="form-group">
              <label>高度 (mm)</label>
              <input v-model.number="currentTemplate.paperHeight" type="number" min="10" max="1000" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>预设尺寸</label>
            <select v-model="paperPreset" @change="applyPaperPreset" class="form-control">
              <option value="">自定义</option>
              <option value="A4">A4 (210×297)</option>
              <option value="A5">A5 (148×210)</option>
              <option value="B5">B5 (176×250)</option>
              <option value="Letter">Letter (216×279)</option>
              <option value="BusinessCard">名片 (90×54)</option>
            </select>
          </div>
        </div>

        <div class="section">
          <h3>打印控件</h3>
          <div class="printer-info">
            <p>Lodop地址: <code>http://127.0.0.1:{{ printerPort }}/CLodopfuncs.js</code></p>
            <div v-if="scriptLoading" class="loading-status loading">
              <span class="spinner"></span> 正在加载打印控件...
            </div>
            <div v-else-if="scriptLoaded" class="loading-status success">
              ✓ 打印控件加载成功
            </div>
            <div v-else-if="loadError" class="loading-status error">
              ✗ {{ loadError }}
              <button class="btn btn-secondary btn-sm mt-2" @click="loadLodopScript">重试</button>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>控件列表</h3>
          <div class="widget-list">
            <div
              v-for="widget in availableWidgets"
              :key="widget.type"
              class="widget-item"
              draggable="true"
              @dragstart="onDragStart($event, widget)"
            >
              <span class="widget-icon">{{ widget.icon }}</span>
              <span class="widget-name">{{ widget.name }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedControl" class="section">
          <h3>控件属性</h3>
          <div class="property-group">
            <label>文本内容</label>
            <input 
              v-model="selectedControl.text" 
              type="text" 
              class="form-control" 
              @input="updateControlSizeOnChange(selectedControl)"
            />
          </div>
          <div class="form-row">
            <div class="property-group">
              <label>字号 (pt)</label>
              <input 
                v-model.number="selectedControl.fontSize" 
                type="number" 
                min="8" 
                max="72" 
                class="form-control" 
                @input="updateControlSizeOnChange(selectedControl)"
              />
            </div>
            <div class="property-group">
              <label>对齐</label>
              <select v-model="selectedControl.align" class="form-control">
                <option value="left">左</option>
                <option value="center">中</option>
                <option value="right">右</option>
              </select>
            </div>
          </div>
          <div class="property-group">
            <label>字体粗细</label>
            <select 
              v-model="selectedControl.fontWeight" 
              class="form-control"
              @change="updateControlSizeOnChange(selectedControl)"
            >
              <option value="normal">正常</option>
              <option value="bold">粗体</option>
            </select>
          </div>
          <div class="form-row">
            <div class="property-group">
              <label>宽度 (mm)</label>
              <input v-model.number="selectedControl.width" type="number" min="10" max="500" class="form-control" />
            </div>
            <div class="property-group">
              <label>高度 (mm)</label>
              <input v-model.number="selectedControl.height" type="number" min="5" max="200" class="form-control" />
            </div>
          </div>
          <button class="btn btn-danger btn-sm full-width" @click="deleteSelectedControl">删除控件</button>
        </div>
      </aside>

      <main class="editor-canvas">
        <div class="canvas-container">
          <div
            class="virtual-paper"
            :style="paperStyle"
            @dragover.prevent
            @drop="onDrop"
            @click="onPaperClick"
          >
            <div
              v-for="control in currentTemplate.controls"
              :key="control.id"
              class="control-item"
              :class="{ selected: selectedControl?.id === control.id }"
              :style="getControlStyle(control)"
              @click.stop="selectControl(control)"
              @mousedown.stop="startDragControl($event, control)"
            >
              {{ control.text || '文本内容' }}
              <div
                v-if="selectedControl?.id === control.id && control.type === 'text'"
                class="resize-handle"
                @mousedown.stop="startResizeControl($event, control)"
              ></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { storageService } from '@/services/storageService'
import { getDeviceConfig } from '@/services/printerService'

const isEditing = ref(false)
const paperPreset = ref('')
const printerPort = ref(8000)

const currentTemplate = reactive({
  id: '',
  name: '',
  paperWidth: 210,
  paperHeight: 297,
  controls: []
})

const selectedControl = ref(null)
const draggedWidget = ref(null)
const draggingControl = ref(null)
const resizingControl = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })
const resizeStartData = reactive({
  initialWidth: 0,
  initialHeight: 0,
  initialFontSize: 0,
  startX: 0,
  startY: 0
})

// 监听选中控件的属性变化，自动调整大小
watch(
  () => selectedControl.value,
  (newControl) => {
    if (newControl) {
      // 保存之前的引用，用于监听属性变化
    }
  }
)

// 当字号、文本或字体粗细变化时，自动调整控件大小
const updateControlSizeOnChange = (control) => {
  if (!control || control.type !== 'text') return
  calculateControlSize(control)
}

const availableWidgets = [
  { type: 'text', name: '文本框', icon: '📝' },
  { type: 'rect', name: '矩形框', icon: '⬜' },
  { type: 'line', name: '线条', icon: '📏' },
  { type: 'barcode', name: '条形码', icon: '🔤' },
  { type: 'qrcode', name: '二维码', icon: '🟆' }
]

const scriptLoaded = ref(false)
const scriptLoading = ref(false)
const loadError = ref('')

const loadLodopScript = async () => {
  scriptLoading.value = true
  loadError.value = ''
  
  try {
    const scriptUrl = `http://127.0.0.1:${printerPort.value}/CLodopfuncs.js`
    
    const existingScript = document.querySelector('script[data-lodop]')
    if (existingScript) {
      document.head.removeChild(existingScript)
    }
    
    const script = document.createElement('script')
    script.setAttribute('data-lodop', 'true')
    script.setAttribute('src', scriptUrl)
    
    await new Promise((resolve, reject) => {
      script.onload = () => {
        resolve()
      }
      script.onerror = () => {
        reject(new Error('加载CLodop脚本失败'))
      }
      document.head.appendChild(script)
    })
    
    scriptLoaded.value = typeof window.getCLodop !== 'undefined'
    if (!scriptLoaded.value) {
      throw new Error('打印控件加载失败')
    }
    loadError.value = ''
  } catch (error) {
    scriptLoaded.value = false
    loadError.value = error.message
  } finally {
    scriptLoading.value = false
  }
}

const loadPrinterConfig = async () => {
  try {
    const result = await getDeviceConfig()
    if (result.success) {
      printerPort.value = result.data.port || 8000
    }
  } catch (err) {
    console.error('加载打印机配置失败:', err)
  }
}

const paperScale = ref(1)

const paperStyle = computed(() => {
  paperScale.value = Math.min(
    (window.innerWidth - 320) / currentTemplate.paperWidth,
    (window.innerHeight - 100) / currentTemplate.paperHeight,
    2
  )
  return {
    width: `${currentTemplate.paperWidth * paperScale.value}px`,
    height: `${currentTemplate.paperHeight * paperScale.value}px`
  }
})

const getControlStyle = (control) => {
  const scale = paperScale.value
  return {
    left: `${control.x * scale}px`,
    top: `${control.y * scale}px`,
    width: `${control.width * scale}px`,
    height: `${control.height * scale}px`,
    fontSize: `${control.fontSize * scale}px`,
    fontWeight: control.fontWeight,
    textAlign: control.align,
    cursor: 'move'
  }
}

const goBack = () => {
  window.history.back()
}

const applyPaperPreset = () => {
  const presets = {
    'A4': { width: 210, height: 297 },
    'A5': { width: 148, height: 210 },
    'B5': { width: 176, height: 250 },
    'Letter': { width: 216, height: 279 },
    'BusinessCard': { width: 90, height: 54 }
  }
  if (presets[paperPreset.value]) {
    currentTemplate.paperWidth = presets[paperPreset.value].width
    currentTemplate.paperHeight = presets[paperPreset.value].height
  }
}

const onDragStart = (event, widget) => {
  draggedWidget.value = widget
  event.dataTransfer.effectAllowed = 'copy'
}

const calculateControlSize = (control) => {
  if (control.type !== 'text') return
  
  // 创建临时元素测量文本大小
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.visibility = 'hidden'
  tempDiv.style.pointerEvents = 'none'
  // 将 pt 转换为 px (1pt = 1.333px)
  tempDiv.style.fontSize = `${control.fontSize * 1.333}px`
  tempDiv.style.fontWeight = control.fontWeight
  tempDiv.style.fontFamily = 'Arial, sans-serif'
  tempDiv.style.whiteSpace = 'nowrap'
  tempDiv.style.padding = '4px'
  tempDiv.style.margin = '0'
  tempDiv.style.boxSizing = 'border-box'
  tempDiv.textContent = control.text || '文本内容'
  
  document.body.appendChild(tempDiv)
  const textWidth = tempDiv.offsetWidth
  const textHeight = tempDiv.offsetHeight
  document.body.removeChild(tempDiv)
  
  // 转换为 mm (近似值，1mm ≈ 3.78px)
  control.width = Math.max(20, Math.ceil(textWidth / 3.78))
  control.height = Math.max(10, Math.ceil(textHeight / 3.78))
}

const onDrop = (event) => {
  if (!draggedWidget.value) return
  const paper = event.currentTarget
  const rect = paper.getBoundingClientRect()
  const x = (event.clientX - rect.left) / paperScale.value
  const y = (event.clientY - rect.top) / paperScale.value
  const newControl = {
    id: Date.now().toString(),
    type: draggedWidget.value.type,
    x: Math.round(x),
    y: Math.round(y),
    width: draggedWidget.value.type === 'text' ? 100 : 80,
    height: draggedWidget.value.type === 'text' ? 25 : (draggedWidget.value.type === 'line' ? 2 : 60),
    text: '',
    fontSize: 12,
    fontWeight: 'normal',
    align: 'left',
    color: '#000000',
    borderWidth: 1,
    borderColor: '#000000'
  }
  
  if (newControl.type === 'text') {
    calculateControlSize(newControl)
  }
  
  currentTemplate.controls.push(newControl)
  selectedControl.value = newControl
  draggedWidget.value = null
}

const onPaperClick = () => {
  selectedControl.value = null
}

const selectControl = (control) => {
  selectedControl.value = control
}

const deleteSelectedControl = () => {
  if (!selectedControl.value) return
  const index = currentTemplate.controls.findIndex(c => c.id === selectedControl.value.id)
  if (index >= 0) {
    currentTemplate.controls.splice(index, 1)
    selectedControl.value = null
  }
}

const startDragControl = (event, control) => {
  selectedControl.value = control
  draggingControl.value = control
  const paper = document.querySelector('.virtual-paper')
  const rect = paper.getBoundingClientRect()
  const scale = paperScale.value
  dragOffset.x = (event.clientX - rect.left) / scale - control.x
  dragOffset.y = (event.clientY - rect.top) / scale - control.y
  document.addEventListener('mousemove', onDragControl)
  document.addEventListener('mouseup', stopDragControl)
}

const onDragControl = (event) => {
  if (!draggingControl.value) return
  const paper = document.querySelector('.virtual-paper')
  const rect = paper.getBoundingClientRect()
  const scale = paperScale.value
  let newX = (event.clientX - rect.left) / scale - dragOffset.x
  let newY = (event.clientY - rect.top) / scale - dragOffset.y
  newX = Math.max(0, Math.min(currentTemplate.paperWidth - draggingControl.value.width, newX))
  newY = Math.max(0, Math.min(currentTemplate.paperHeight - draggingControl.value.height, newY))
  draggingControl.value.x = Math.round(newX)
  draggingControl.value.y = Math.round(newY)
}

const stopDragControl = () => {
  draggingControl.value = null
  document.removeEventListener('mousemove', onDragControl)
  document.removeEventListener('mouseup', stopDragControl)
}

const startResizeControl = (event, control) => {
  if (control.type !== 'text') return
  selectedControl.value = control
  resizingControl.value = control
  
  resizeStartData.initialWidth = control.width
  resizeStartData.initialHeight = control.height
  resizeStartData.initialFontSize = control.fontSize
  resizeStartData.startX = event.clientX
  resizeStartData.startY = event.clientY
  
  document.addEventListener('mousemove', onResizeControl)
  document.addEventListener('mouseup', stopResizeControl)
}

const onResizeControl = (event) => {
  if (!resizingControl.value) return
  
  const scale = paperScale.value
  const deltaX = (event.clientX - resizeStartData.startX) / scale
  const deltaY = (event.clientY - resizeStartData.startY) / scale
  
  // 计算缩放比例，保持宽高比
  const initialAspectRatio = resizeStartData.initialWidth / resizeStartData.initialHeight
  const newWidth = Math.max(20, resizeStartData.initialWidth + deltaX)
  const newHeight = Math.max(10, newWidth / initialAspectRatio)
  
  // 更新控件尺寸
  resizingControl.value.width = Math.round(newWidth)
  resizingControl.value.height = Math.round(newHeight)
  
  // 计算字号缩放比例
  const widthRatio = newWidth / resizeStartData.initialWidth
  const newFontSize = Math.max(8, Math.min(72, resizeStartData.initialFontSize * widthRatio))
  resizingControl.value.fontSize = Math.round(newFontSize)
}

const stopResizeControl = () => {
  resizingControl.value = null
  document.removeEventListener('mousemove', onResizeControl)
  document.removeEventListener('mouseup', stopResizeControl)
}

const saveTemplate = async () => {
  if (!currentTemplate.name.trim()) {
    alert('请输入模板名称')
    return
  }
  try {
    const result = await storageService.saveTemplate(currentTemplate)
    if (result.success) {
      alert('模板保存成功')
      goBack()
    } else {
      alert(result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存模板失败:', error)
    alert('保存失败')
  }
}

const previewTemplate = () => {
  if (!scriptLoaded.value) {
    alert('打印控件尚未加载成功，请确保Lodop服务已运行')
    return
  }
  
  try {
    const LODOP = window.getCLodop()
    if (!LODOP) {
      alert('打印控件未加载，请确保Lodop服务已运行')
      return
    }
    
    LODOP.PRINT_INIT(currentTemplate.name || '打印模板预览')
    LODOP.SET_PRINT_PAGESIZE(0, currentTemplate.paperWidth, currentTemplate.paperHeight, '自定义纸张')
    
    currentTemplate.controls.forEach((control) => {
      if (control.type === 'text') {
        LODOP.ADD_PRINT_TEXT(control.y, control.x, control.width, control.height, control.text || '')
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', control.fontSize)
        LODOP.SET_PRINT_STYLEA(0, 'Bold', control.fontWeight === 'bold' ? 1 : 0)
        const align = control.align === 'center' ? 2 : (control.align === 'right' ? 3 : 1)
        LODOP.SET_PRINT_STYLEA(0, 'Alignment', align)
      } else if (control.type === 'rect') {
        LODOP.ADD_PRINT_RECT(control.y, control.x, control.width, control.height, 0, control.borderWidth || 1)
      } else if (control.type === 'line') {
        LODOP.ADD_PRINT_LINE(control.y, control.x, control.y, control.x + control.width, control.borderWidth || 1)
      }
    })
    
    LODOP.PREVIEW()
  } catch (error) {
    console.error('预览出错:', error)
    alert('预览出错: ' + error.message)
  }
}

onMounted(async () => {
  await loadPrinterConfig()
  await loadLodopScript()
  
  const params = new URLSearchParams(window.location.search)
  const templateId = params.get('id')
  if (templateId) {
    storageService.getTemplate(templateId).then(result => {
      if (result.success) {
        const template = result.data
        currentTemplate.id = template.id
        currentTemplate.name = template.name
        currentTemplate.paperWidth = template.paperWidth || 210
        currentTemplate.paperHeight = template.paperHeight || 297
        currentTemplate.controls = JSON.parse(JSON.stringify(template.controls || []))
        isEditing.value = true
      }
    })
  }
})
</script>

<style scoped>
.template-editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #1a1a1a;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.header-right {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-primary {
  background: #00d8ff;
  color: #1a1a1a;
}

.btn-primary:hover {
  background: #00b8e6;
}

.btn-secondary {
  background: #3d3d3d;
  color: white;
}

.btn-secondary:hover {
  background: #4d4d4d;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover {
  background: #ff3742;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 300px;
  min-width: 300px;
  background: #2d2d2d;
  border-right: 1px solid #3d3d3d;
  padding: 20px;
  overflow-y: auto;
  flex-shrink: 0;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #999;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #00d8ff;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.printer-info {
  margin-top: 12px;
}

.printer-info p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #e0e0e0;
}

.printer-info code {
  background: #1a1a1a;
  padding: 2px 6px;
  border-radius: 4px;
  color: #00d8ff;
  font-size: 12px;
}

.loading-status {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-status.loading {
  background: rgba(0, 216, 255, 0.1);
  color: #00d8ff;
}

.loading-status.success {
  background: rgba(46, 213, 115, 0.1);
  color: #2ed573;
}

.loading-status.error {
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
}

.widget-item:hover {
  border-color: #00d8ff;
  background: rgba(0, 216, 255, 0.1);
}

.widget-item:active {
  cursor: grabbing;
}

.widget-icon {
  font-size: 20px;
}

.widget-name {
  font-size: 14px;
  color: #e0e0e0;
}

.property-group {
  margin-bottom: 12px;
}

.property-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #999;
}

.full-width {
  width: 100%;
}

.mt-2 {
  margin-top: 8px;
}

.editor-canvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  overflow: auto;
}

.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.virtual-paper {
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  flex-shrink: 0;
}

.control-item {
  position: absolute;
  border: 2px solid transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

.control-item:hover {
  border-color: rgba(0, 216, 255, 0.5);
}

.control-item.selected {
  border-color: #00d8ff;
  box-shadow: 0 0 0 2px rgba(0, 216, 255, 0.3);
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #00d8ff;
  border: 2px solid white;
  border-radius: 2px;
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 100;
  box-sizing: border-box;
}

.resize-handle:hover {
  background: #00b8e6;
  transform: scale(1.1);
  transition: transform 0.1s ease;
}
</style>
