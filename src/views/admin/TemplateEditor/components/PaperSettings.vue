<template>
  <div class="section">
    <h3>纸张设置</h3>
    <div class="form-group">
      <label>模板名称</label>
      <input 
        v-model="template.name" 
        type="text" 
        placeholder="请输入模板名称" 
        class="form-control" 
      />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>宽度 (mm)</label>
        <input 
          v-model.number="template.paperWidth" 
          type="number" 
          min="10" 
          max="1000" 
          class="form-control" 
        />
      </div>
      <div class="form-group">
        <label>高度 (mm)</label>
        <input 
          v-model.number="template.paperHeight" 
          type="number" 
          min="10" 
          max="1000" 
          class="form-control" 
        />
      </div>
    </div>
    <div class="form-group">
      <label>预设尺寸</label>
      <select 
        v-model="localPaperPreset" 
        class="form-control"
        @change="handlePresetChange"
      >
        <option value="">自定义</option>
        <option value="A4">A4 (210×297)</option>
        <option value="A5">A5 (148×210)</option>
        <option value="B5">B5 (176×250)</option>
        <option value="Letter">Letter (216×279)</option>
        <option value="BusinessCard">名片 (90×54)</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  template: {
    type: Object,
    required: true
  },
  paperPreset: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:paper-preset'])

const localPaperPreset = ref(props.paperPreset)

watch(() => props.paperPreset, (newPreset) => {
  localPaperPreset.value = newPreset
})

const handlePresetChange = () => {
  emit('update:paper-preset', localPaperPreset.value)
}
</script>