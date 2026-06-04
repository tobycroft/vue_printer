<template>
  <div class="canvas-container">
    <div
      class="virtual-paper"
      :style="paperStyle"
      @dragover.prevent
      @drop="$emit('drop', $event)"
      @click="$emit('paper-click')"
    >
      <div
        v-for="control in template.controls"
        :key="control.id"
        class="control-item"
        :class="{
          selected: selectedControl?.id === control.id,
          'line-control': control.type === 'line'
        }"
        :style="getControlStyle(control)"
        @click.stop="$emit('control-select', control)"
        @mousedown.stop="$emit('control-drag-start', $event, control)"
      >
        <!-- 固定文本 -->
        <template v-if="control.type === 'text'">
          {{ control.text || '文本内容' }}
        </template>
        
        <!-- 数据文本 -->
        <template v-else-if="control.type === 'data_text'">
          <template v-if="control.placeholderMode === 'prefix'">
            {{ control.placeholderText || '占位文本' }}[数据文本]
          </template>
          <template v-else>
            [数据文本]{{ control.placeholderText || '占位文本' }}
          </template>
        </template>
        
        <!-- 线条 -->
        <template v-else-if="control.type === 'line'">
          <div class="line-display"></div>
        </template>
        
        <!-- 图片 -->
        <template v-else-if="control.type === 'image'">
          <div v-if="control.imageType === 'barcode'">
            📦 条形码占位符
          </div>
          <div v-else>
            📱 二维码占位符
          </div>
        </template>
        
        <!-- 默认占位符 -->
        <template v-else>
          🎨 控件占位符
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

defineProps({
  template: {
    type: Object,
    required: true
  },
  selectedControl: {
    type: Object,
    default: null
  },
  paperStyle: {
    type: Object,
    required: true
  }
})

const getControlStyle = (control) => {
  const style = {
    left: `${control.x}mm`,
    top: `${control.y}mm`,
    width: `${control.width}mm`,
    height: `${control.height}mm`
  }

  // 根据控件类型添加特定样式
  if (control.type === 'text' || control.type === 'data_text') {
    Object.assign(style, {
      fontSize: `${control.fontSize}pt`,
      fontWeight: control.fontWeight,
      textAlign: control.align
    })
  }

  if (control.type === 'line') {
    Object.assign(style, {
      height: `${control.borderWidth || 2}px`,
      transform: `translateY(-50%)`
    })
  }

  return style
}
</script>