<template>
  <div class="template-editor-container">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn btn-secondary back-btn" @click="goBack">
          ← 返回列表
        </button>
        <h2>{{ isEditing ? '编辑模板' : '新建模板' }}</h2>
      </div>
      <div class="header-center">
        <div class="paper-settings-inline">
          <div class="paper-input-group">
            <label>模板名称</label>
            <input 
              v-model="currentTemplate.name" 
              type="text" 
              placeholder="请输入模板名称" 
              class="form-control paper-name-input"
            />
          </div>
          <div class="paper-input-group">
            <label>宽度 (mm)</label>
            <input 
              v-model.number="currentTemplate.paperWidth" 
              type="number" 
              min="10" 
              max="1000" 
              class="form-control paper-size-input"
            />
          </div>
          <div class="paper-input-group">
            <label>高度 (mm)</label>
            <input 
              v-model.number="currentTemplate.paperHeight" 
              type="number" 
              min="10" 
              max="1000" 
              class="form-control paper-size-input"
            />
          </div>
          <div class="paper-input-group">
            <label>预设</label>
            <select 
              v-model="paperPreset" 
              class="form-control paper-preset-select"
              @change="applyPaperPreset(paperPreset)"
            >
              <option value="">自定义</option>
              <optgroup label="标准纸张">
                <option value="A4">A4 (210×297)</option>
                <option value="A5">A5 (148×210)</option>
                <option value="B5">B5 (176×250)</option>
                <option value="Letter">Letter (216×279)</option>
                <option value="BusinessCard">名片 (90×54)</option>
              </optgroup>
              <optgroup label="快递二联单">
                <option value="ExpressTwoPart">快递二联单 (100×180)</option>
              </optgroup>
              <optgroup label="快递一联单">
                <option value="ExpressOnePart">快递一联单 (76×130)</option>
              </optgroup>
              <optgroup label="小单">
                <option value="Small_40x50">小单 (40×50)</option>
                <option value="Small_40x60">小单 (40×60)</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="() => previewTemplate(lodopPreviewTemplate)" :disabled="loading || controlsLoading">预览</button>
        <button class="btn btn-primary" @click="saveTemplate" :disabled="loading || saving || controlsLoading">
          {{ saving || controlsLoading ? '保存中...' : '保存模板' }}
        </button>
      </div>
    </header>

    <div class="editor-main">
      <aside class="editor-sidebar">
        <ControlProperties
          v-if="selectedControl"
          :control="selectedControl"
          @update="watchControlUpdates"
          @delete="handleDeleteControl"
        />

        <WidgetList
          :widgets="availableWidgets"
          @drag-start="onDragStart"
        />

        <PrinterControls
          :script-loaded="scriptLoaded"
          :script-loading="scriptLoading"
          :load-error="loadError"
          @retry-load="loadLodopScript"
        />
      </aside>

      <main class="editor-canvas">
        <div class="canvas-wrapper" ref="canvasWrapperRef">
          <TemplateCanvas
            :template="currentTemplate"
            :selected-control="selectedControl"
            :paper-style="paperStyle"
            :mm-to-px-ratio="currentMmToPxRatio"
            @drop="onDrop"
            @paper-click="onPaperClick"
            @control-select="selectControl"
            @control-drag-start="startDragControl"
            @control-resize-start="startResizeControl"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PrinterControls from './components/PrinterControls.vue'
import WidgetList from './components/WidgetList.vue'
import ControlProperties from './components/ControlProperties.vue'
import TemplateCanvas from './components/TemplateCanvas.vue'
import useTemplateEditor from './composables/useTemplateEditor'
import useControlOperations from './composables/useControlOperations'
import useLodopIntegration from './composables/useLodopIntegration'

import './TemplateEditor.css'

const route = useRoute()
const router = useRouter()

console.log('TemplateEditor route:', route)
console.log('route.query.id:', route.query.id)

const isEditing = ref(!!route.query.id)
const currentTemplate = reactive({
  id: route.query.id ? Number(route.query.id) : null,
  name: '',
  paperWidth: 210,
  paperHeight: 297,
  controls: []
})

console.log('currentTemplate.id initialized:', currentTemplate.id)

// 监听路由 query 变化
watch(() => route.query.id, (newId) => {
  console.log('route.query.id changed:', newId)
  if (newId) {
    currentTemplate.id = Number(newId)
    isEditing.value = true
  }
})

const paperPreset = ref('')

// 纸张预设尺寸映射
const presetSizes = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'B5': { width: 176, height: 250 },
  'Letter': { width: 216, height: 279 },
  'BusinessCard': { width: 90, height: 54 },
  'ExpressTwoPart': { width: 100, height: 180 },
  'ExpressOnePart': { width: 76, height: 130 },
  'Small_40x50': { width: 40, height: 50 },
  'Small_40x60': { width: 40, height: 60 }
}

// 应用纸张预设
const applyPaperPreset = (preset) => {
  paperPreset.value = preset
  if (presetSizes[preset]) {
    currentTemplate.paperWidth = presetSizes[preset].width
    currentTemplate.paperHeight = presetSizes[preset].height
  }
}

// 使用组合式函数
const {
  paperStyle,
  currentMmToPxRatio,
  canvasWrapperRef,
  selectedControl,
  availableWidgets,
  loading,
  saving,
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
} = useTemplateEditor(
  currentTemplate,
  isEditing,
  router
)

const {
  onDragStart,
  onDrop,
  onPaperClick,
  startDragControl,
  startResizeControl,
  watchControlUpdates,
  controlsLoading,
  deleteControl,
  loadControls,
  saveControls
} = useControlOperations(
  currentTemplate,
  selectedControl,
  currentMmToPxRatio
)

// 设置控件加载和保存函数
setLoadControlsFn(loadControls)
setSaveControlsFn(saveControls)

// 监听路由变化，确保在 id 变化时重新加载
watch(() => route.query.id, (newId) => {
  console.log('Route query id changed:', newId)
  if (newId) {
    currentTemplate.id = Number(newId)
    isEditing.value = true
  }
}, { immediate: true })

const {
  scriptLoaded,
  scriptLoading,
  loadError,
  loadLodopScript,
  previewTemplate: lodopPreviewTemplate
} = useLodopIntegration()

const handleDeleteControl = async () => {
  if (selectedControl.value) {
    const controlId = selectedControl.value.id
    // 直接调用 deleteControl 函数
    await deleteControl(controlId)
  }
}

onMounted(() => {
  console.log('Template editor mounted, currentTemplate.id:', currentTemplate.id, 'isEditing:', isEditing.value)
  
  // 如果有 id，显式加载数据
  if (currentTemplate.id) {
    console.log('Explicitly loading template and controls...')
    loadTemplate(loadControls)
  }
  
  loadLodopScript()
})

onUnmounted(() => {
  // 清理逻辑
  handleUnmount()
})
</script>