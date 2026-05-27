<template>
  <div class="templates-container">
    <!-- 模板列表视图 -->
    <div v-if="viewMode === 'list'" class="list-view">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h2>打印模板管理</h2>
            <p>查看和管理所有打印模板</p>
          </div>
          <button class="btn btn-primary add-btn" @click="showAddModal = true">
            <span class="btn-icon">➕</span>
            新增模板
          </button>
        </div>
      </div>

      <!-- 模板列表 -->
      <div v-if="templates.length > 0" class="templates-list">
        <table class="templates-table">
          <thead>
            <tr>
              <th>模板名称</th>
              <th>纸张尺寸</th>
              <th>控件数量</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template.id">
              <td>{{ template.name }}</td>
              <td>{{ template.paperWidth }} × {{ template.paperHeight }} mm</td>
              <td>{{ template.controls ? template.controls.length : 0 }}</td>
              <td>{{ formatDate(template.createdAt) }}</td>
              <td class="actions">
                <button class="btn btn-secondary" @click="editTemplate(template)">修改</button>
                <button class="btn btn-danger" @click="deleteTemplate(template.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 无模板提示 -->
      <div v-else class="no-templates">
        <p>暂无打印模板</p>
        <button class="btn btn-primary" @click="showAddModal = true">新建模板</button>
      </div>
    </div>

    <!-- 模板编辑器视图 -->
    <div v-if="viewMode === 'editor'" class="editor-view">
      <div class="editor-header">
        <button class="btn btn-secondary back-btn" @click="backToList">
          ← 返回列表
        </button>
        <h2>{{ isEditing ? '编辑模板' : '新建模板' }}</h2>
        <div class="header-actions">
          <button class="btn btn-primary" @click="previewTemplate">预览</button>
          <button class="btn btn-primary" @click="saveTemplate">保存模板</button>
        </div>
      </div>

      <!-- 纸张设置 -->
      <div class="paper-settings">
        <h3>纸张设置</h3>
        <div class="settings-grid">
          <div class="form-group">
            <label>模板名称</label>
            <input v-model="currentTemplate.name" type="text" placeholder="请输入模板名称" class="form-control" />
          </div>
          <div class="form-group">
            <label>纸张宽度 (mm)</label>
            <input v-model.number="currentTemplate.paperWidth" type="number" min="10" max="1000" class="form-control" />
          </div>
          <div class="form-group">
            <label>纸张高度 (mm)</label>
            <input v-model.number="currentTemplate.paperHeight" type="number" min="10" max="1000" class="form-control" />
          </div>
          <div class="form-group">
            <label>预设尺寸</label>
            <select v-model="paperPreset" @change="applyPaperPreset" class="form-control">
              <option value="">自定义</option>
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="B5">B5 (176 × 250 mm)</option>
              <option value="Letter">Letter (216 × 279 mm)</option>
              <option value="BusinessCard">名片 (90 × 54 mm)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 编辑区域 -->
      <div class="editor-content">
        <!-- 控件列表 -->
        <div class="widget-panel">
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
          
          <!-- 选中控件属性 -->
          <div v-if="selectedControl" class="control-properties">
            <h4>控件属性</h4>
            <div class="property-group">
              <label>文本内容</label>
              <input v-model="selectedControl.text" type="text" class="form-control" />
            </div>
            <div class="property-group">
              <label>字体大小 (pt)</label>
              <input v-model.number="selectedControl.fontSize" type="number" min="8" max="72" class="form-control" />
            </div>
            <div class="property-group">
              <label>字体粗细</label>
              <select v-model="selectedControl.fontWeight" class="form-control">
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
              </select>
            </div>
            <div class="property-group">
              <label>水平对齐</label>
              <select v-model="selectedControl.align" class="form-control">
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div class="property-group">
              <label>宽度 (mm)</label>
              <input v-model.number="selectedControl.width" type="number" min="10" max="500" class="form-control" />
            </div>
            <div class="property-group">
              <label>高度 (mm)</label>
              <input v-model.number="selectedControl.height" type="number" min="5" max="200" class="form-control" />
            </div>
            <button class="btn btn-danger btn-sm" @click="deleteSelectedControl">删除控件</button>
          </div>
        </div>

        <!-- 虚拟纸张 -->
        <div class="paper-container">
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
      </div>
    </div>

    <!-- 新增模板弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新建模板</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="template-name">模板名称</label>
            <input
              id="template-name"
              v-model="addForm.name"
              type="text"
              placeholder="请输入模板名称"
              class="form-control"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="createTemplate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { storageService } from '@/services/storageService'

const viewMode = ref('list')
const templates = ref([])
const showAddModal = ref(false)
const isEditing = ref(false)
const paperPreset = ref('')

const addForm = reactive({
  name: ''
})

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
  const scale = 595 / currentTemplate.paperWidth
  return {
    width: `${currentTemplate.paperWidth * scale}px`,
    height: `${currentTemplate.paperHeight * scale}px`
  }
})

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return timestamp
  }
}

const getControlStyle = (control) => {
  const scale = 595 / currentTemplate.paperWidth
  return {
    left: `${control.x * scale}px`,
    top: `${control.y * scale}px`,
    width: `${control.width * scale}px`,
    height: `${control.height * scale}px`,
    fontSize: `${control.fontSize * scale * 0.35}px`,
    fontWeight: control.fontWeight,
    textAlign: control.align,
    cursor: 'move'
  }
}

const fetchTemplates = async () => {
  try {
    const result = await storageService.getTemplates()
    if (result.success) {
      templates.value = result.data
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

const createTemplate = () => {
  if (!addForm.name.trim()) {
    alert('请输入模板名称')
    return
  }
  
  currentTemplate.id = ''
  currentTemplate.name = addForm.name
  currentTemplate.paperWidth = 210
  currentTemplate.paperHeight = 297
  currentTemplate.controls = []
  selectedControl.value = null
  isEditing.value = false
  showAddModal.value = false
  viewMode.value = 'editor'
}

const editTemplate = (template) => {
  currentTemplate.id = template.id
  currentTemplate.name = template.name
  currentTemplate.paperWidth = template.paperWidth || 210
  currentTemplate.paperHeight = template.paperHeight || 297
  currentTemplate.controls = JSON.parse(JSON.stringify(template.controls || []))
  selectedControl.value = null
  isEditing.value = true
  viewMode.value = 'editor'
}

const deleteTemplate = async (id) => {
  if (!confirm('确定要删除该模板吗？')) {
    return
  }
  
  try {
    const result = await storageService.deleteTemplate(id)
    if (result.success) {
      await fetchTemplates()
      alert('模板删除成功')
    } else {
      alert(result.message || '删除失败')
    }
  } catch (error) {
    console.error('删除模板失败:', error)
    alert('删除失败')
  }
}

const backToList = () => {
  viewMode.value = 'list'
  selectedControl.value = null
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
  
  const scale = 595 / currentTemplate.paperWidth
  const rect = event.currentTarget.getBoundingClientRect()
  
  dragOffset.x = event.clientX - rect.left
  dragOffset.y = event.clientY - rect.top
  
  document.addEventListener('mousemove', onDragControl)
  document.addEventListener('mouseup', stopDragControl)
}

const onDragControl = (event) => {
  if (!draggingControl.value) return
  
  const paper = document.querySelector('.virtual-paper')
  const rect = paper.getBoundingClientRect()
  const scale = currentTemplate.paperWidth / rect.width
  
  let newX = (event.clientX - rect.left - dragOffset.x / scale)
  let newY = (event.clientY - rect.top - dragOffset.y / scale)
  
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
      viewMode.value = 'list'
      await fetchTemplates()
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
      LODOP.ADD_PRINT_TEXT(
        control.y,
        control.x,
        control.width,
        control.height,
        control.text || ''
      )
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', control.fontSize)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', control.fontWeight === 'bold' ? 1 : 0)
      LODOP.SET_PRINT_STYLEA(0, 'Alignment', 
        control.align === 'center' ? 2 : (control.align === 'right' ? 3 : 1)
      )
    } else if (control.type === 'rect') {
      LODOP.ADD_PRINT_RECT(
        control.y,
        control.x,
        control.width,
        control.height,
        0,
        control.borderWidth || 1
      )
    } else if (control.type === 'line') {
      LODOP.ADD_PRINT_LINE(
        control.y,
        control.x,
        control.y,
        control.x + control.width,
        control.borderWidth || 1
      )
    }
  })
  
  LODOP.PREVIEW()
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.templates-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* 列表视图样式 */
.list-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.header-text p {
  margin: 0;
  font-size: 14px;
  color: #999;
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
  padding: 4px 8px;
  font-size: 12px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon {
  font-size: 14px;
}

.templates-list {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  overflow: hidden;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
}

.templates-table th,
.templates-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #3d3d3d;
}

.templates-table th {
  background: #3d3d3d;
  color: #ffffff;
  font-weight: 600;
}

.templates-table td {
  color: #e0e0e0;
}

.templates-table tr:hover {
  background: #353535;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .btn {
  font-size: 12px;
  padding: 4px 10px;
}

.no-templates {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.no-templates p {
  margin: 0 0 20px 0;
  color: #999;
  font-size: 16px;
}

/* 编辑器视图样式 */
.editor-view {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #3d3d3d;
}

.editor-header h2 {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.paper-settings {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.paper-settings h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #ffffff;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-size: 13px;
  color: #999;
}

.form-control {
  padding: 8px 12px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #00d8ff;
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

.widget-panel {
  width: 220px;
  flex-shrink: 0;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.widget-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #ffffff;
}

.widget-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
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
  font-size: 18px;
}

.widget-name {
  font-size: 13px;
  color: #e0e0e0;
}

.control-properties {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #3d3d3d;
}

.control-properties h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #ffffff;
}

.property-group {
  margin-bottom: 12px;
}

.property-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #999;
}

.paper-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
  overflow: auto;
}

.virtual-paper {
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  min-height: 300px;
}

.control-item {
  position: absolute;
  background: rgba(0, 131, 199, 0.1);
  border: 1px dashed #0083c7;
  border-radius: 4px;
  padding: 4px;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
}

.control-item.selected {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #3d3d3d;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
}

.close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #3d3d3d;
}
</style>