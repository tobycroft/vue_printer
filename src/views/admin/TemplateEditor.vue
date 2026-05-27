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
            <input v-model="selectedControl.text" type="text" class="form-control" />
          </div>
          <div class="form-row">
            <div class="property-group">
              <label>字号 (pt)</label>
              <input v-model.number="selectedControl.fontSize" type="number" min="8" max="72" class="form-control" />
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
            <select v-model="selectedControl.fontWeight" class="form-control">
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
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { storageService } from '@/services/storageService'

const isEditing = ref(false)
const paperPreset = ref('')

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
const dragOffset = reactive({ x: 0, y: 0 })

const availableWidgets = [
  { type: 'text', name: '文本框', icon: '📝' },
  { type: 'rect', name: '矩形框', icon: '⬜' },
  { type: 'line', name: '线条', icon: '📏' },
  { type: 'barcode', name: '条形码', icon: '🔤' },
  { type: 'qrcode', name: '二维码', icon: '🟆' }
]

const paperStyle = computed(() => {
  const scale = Math.min(
    (window.innerWidth - 320) / currentTemplate.paperWidth,
    (window.innerHeight - 100) / currentTemplate.paperHeight,
    2
  )
  return {
    width: `${currentTemplate.paperWidth * scale}px`,
    height: `${currentTemplate.paperHeight * scale}px`,
    transform: `scale(${scale})`,
    transformOrigin: 'top left'
  }
})

const getControlStyle = (control) => {
  return {
    left: `${control.x}px`,
    top: `${control.y}px`,
    width: `${control.width}px`,
    height: `${control.height}px`,
    fontSize: `${control.fontSize}px`,
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

const onDrop = (event) => {
  if (!draggedWidget.value) return
  const paper = event.currentTarget
  const rect = paper.getBoundingClientRect()
  const scale = currentTemplate.paperWidth / rect.width
  const x = (event.clientX - rect.left) * scale
  const y = (event.clientY - rect.top) * scale
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
  const paper = event.currentTarget
  const rect = paper.getBoundingClientRect()
  dragOffset.x = event.clientX - rect.left - control.x
  dragOffset.y = event.clientY - rect.top - control.y
  document.addEventListener('mousemove', onDragControl)
  document.addEventListener('mouseup', stopDragControl)
}

const onDragControl = (event) => {
  if (!draggingControl.value) return
  const paper = document.querySelector('.virtual-paper')
  const rect = paper.getBoundingClientRect()
  let newX = event.clientX - rect.left - dragOffset.x
  let newY = event.clientY - rect.top - dragOffset.y
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
  if (typeof window.getLodop === 'undefined') {
    alert('请先安装Lodop打印控件')
    return
  }
  const LODOP = window.getLodop()
  if (!LODOP) {
    alert('获取打印控件失败')
    return
  }
  LODOP.PRINT_INIT(currentTemplate.name || '打印模板预览')
  LODOP.SET_PRINT_PAGESIZE(0, currentTemplate.paperWidth, currentTemplate.paperHeight, '自定义纸张')
  currentTemplate.controls.forEach((control) => {
    if (control.type === 'text') {
      LODOP.ADD_PRINT_TEXT(control.y, control.x, control.width, control.height, control.text || '')
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', control.fontSize)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', control.fontWeight === 'bold' ? 1 : 0)
      LODOP.SET_PRINT_STYLEA(0, 'Alignment', control.align === 'center' ? 2 : (control.align === 'right' ? 3 : 1))
    } else if (control.type === 'rect') {
      LODOP.ADD_PRINT_RECT(control.y, control.x, control.width, control.height, 0, control.borderWidth || 1)
    } else if (control.type === 'line') {
      LODOP.ADD_PRINT_LINE(control.y, control.x, control.y, control.x + control.width, control.borderWidth || 1)
    }
  })
  LODOP.PREVIEW()
}

onMounted(() => {
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

.full-width {
  width: 100%;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: #2d2d2d;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #3d3d3d;
}

.section {
  margin-bottom: 20px;
}

.section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #ffffff;
  padding-bottom: 8px;
  border-bottom: 1px solid #3d3d3d;
}

.form-group, .property-group {
  margin-bottom: 12px;
}

.form-group label, .property-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
}

.form-control {
  width: 100%;
  padding: 6px 8px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  color: #ffffff;
  font-size: 13px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #00d8ff;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row .form-group, .form-row .property-group {
  flex: 1;
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  cursor: grab;
  transition: all 0.2s;
}

.widget-item:hover {
  border-color: #00d8ff;
  background: #252525;
}

.widget-item:active {
  cursor: grabbing;
}

.widget-icon {
  font-size: 16px;
}

.widget-name {
  font-size: 13px;
  color: #e0e0e0;
}

.editor-canvas {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1a1a1a;
  padding: 20px;
}

.canvas-container {
  position: relative;
  overflow: hidden;
}

.virtual-paper {
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  min-width: 100px;
  min-height: 100px;
}

.control-item {
  position: absolute;
  background: rgba(0, 131, 199, 0.1);
  border: 1px dashed #0083c7;
  border-radius: 3px;
  padding: 2px 4px;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  white-space: nowrap;
  color: #333;
}

.control-item.selected {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}
</style>