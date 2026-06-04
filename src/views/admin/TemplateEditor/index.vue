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
        <button class="btn btn-primary" @click="previewTemplate" :disabled="loading">预览</button>
        <button class="btn btn-primary" @click="saveTemplate" :disabled="loading || saving">
          {{ saving ? '保存中...' : '保存模板' }}
        </button>
      </div>
    </header>

    <div class="editor-main">
      <aside class="editor-sidebar">
        <PaperSettings
          :template="currentTemplate"
          :paper-preset="paperPreset"
          @update:template="updateTemplate"
          @update:paper-preset="applyPaperPreset"
        />

        <PrinterControls
          :script-loaded="scriptLoaded"
          :script-loading="scriptLoading"
          :load-error="loadError"
          @retry-load="loadLodopScript"
        />

        <WidgetList
          :widgets="availableWidgets"
          @drag-start="onDragStart"
        />

        <ControlProperties
          v-if="selectedControl"
          :control="selectedControl"
          @update="watchControlUpdates"
          @delete="handleDeleteControl"
        />
      </aside>

      <main class="editor-canvas">
        <TemplateCanvas
          :template="currentTemplate"
          :selected-control="selectedControl"
          :paper-style="paperStyle"
          @drop="onDrop"
          @paper-click="onPaperClick"
          @control-select="selectControl"
          @control-drag-start="startDragControl"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PaperSettings from './components/PaperSettings.vue'
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

const isEditing = ref(!!route.params.id)
const currentTemplate = reactive({
  id: route.params.id || null,
  name: '',
  paperWidth: 210,
  paperHeight: 297,
  controls: []
})

const paperPreset = ref('')

// 纸张预设尺寸映射
const presetSizes = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'B5': { width: 176, height: 250 },
  'Letter': { width: 216, height: 279 },
  'BusinessCard': { width: 90, height: 54 }
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
  selectedControl,
  availableWidgets,
  loading,
  saving,
  goBack,
  saveTemplate,
  previewTemplate,
  updateTemplate,
  selectControl,
  deleteSelectedControl
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
  watchControlUpdates,
  controlsLoading,
  deleteControl
} = useControlOperations(
  currentTemplate,
  selectedControl
)

const {
  scriptLoaded,
  scriptLoading,
  loadError,
  loadLodopScript
} = useLodopIntegration()

const handleDeleteControl = async () => {
  if (selectedControl.value) {
    const controlId = selectedControl.value.id
    // 先从本地删除
    const index = currentTemplate.controls.findIndex(
      c => c.id === selectedControl.value.id
    )
    if (index !== -1) {
      currentTemplate.controls.splice(index, 1)
      
      // 再调用API删除
      if (controlId) {
        await deleteControl(controlId)
      }
      
      selectedControl.value = null
    }
  }
}

onMounted(() => {
  // 如果是编辑模式，模板数据会在useTemplateEditor中自动加载
  console.log('Template editor mounted, isEditing:', isEditing.value)
  
  loadLodopScript()
})

onUnmounted(() => {
  // 清理逻辑
})
</script>