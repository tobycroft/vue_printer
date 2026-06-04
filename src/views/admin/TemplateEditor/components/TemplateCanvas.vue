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
        :data-align="control.align || 'left'"
        @click.stop="$emit('control-select', control)"
        @mousedown.stop="$emit('control-drag-start', $event, control)"
        @drop.stop.prevent
        @dragover.stop.prevent
      >
        <!-- 调整大小控制点（仅在选中时显示） -->
        <template v-if="selectedControl?.id === control.id">
          <div
            class="resize-handle resize-nw"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'nw')"
          ></div>
          <div
            class="resize-handle resize-n"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'n')"
          ></div>
          <div
            class="resize-handle resize-ne"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'ne')"
          ></div>
          <div
            class="resize-handle resize-w"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'w')"
          ></div>
          <div
            class="resize-handle resize-e"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'e')"
          ></div>
          <div
            class="resize-handle resize-sw"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'sw')"
          ></div>
          <div
            class="resize-handle resize-s"
            @mousedown.stop="$emit('control-resize-start', $event, control, 's')"
          ></div>
          <div
            class="resize-handle resize-se"
            @mousedown.stop="$emit('control-resize-start', $event, control, 'se')"
          ></div>
        </template>
        
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

const props = defineProps({
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
  },
  mmToPxRatio: {
    type: Number,
    default: 3.78 // 默认约 1mm = 3.78px (96dpi)
  }
})

const getControlStyle = (control) => {
  const ratio = props.mmToPxRatio
  const style = {
    left: `${control.x * ratio}px`,
    top: `${control.y * ratio}px`,
    width: `${control.width * ratio}px`,
    height: `${control.height * ratio}px`
  }

  // 根据控件类型添加特定样式
  if (control.type === 'text' || control.type === 'data_text') {
    // 字体大小也按比例调整
    const adjustedFontSize = control.fontSize * (ratio / 3.78) // 相对于 96dpi 的基础比例
    Object.assign(style, {
      fontSize: `${adjustedFontSize}pt`,
      fontWeight: control.fontWeight,
      textAlign: control.align
    })
  }

  if (control.type === 'line') {
    // 线条宽度也按比例调整
    const adjustedBorderWidth = (control.borderWidth || 2) * (ratio / 3.78)
    Object.assign(style, {
      height: `${adjustedBorderWidth}px`,
      transform: `translateY(-50%)`
    })
  }

  return style
}
</script>

<style scoped>
.control-item {
  position: absolute;
  box-sizing: border-box;
  cursor: move;
  user-select: none;
  overflow: hidden;
  padding: 4px;
  will-change: transform, left, top;
  contain: layout style;
}

.control-item.selected {
  border: 2px dashed #00d8ff;
  background-color: rgba(0, 216, 255, 0.05);
}

.control-item.dragging {
  pointer-events: none;
  z-index: 1000;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #ffffff;
  border: 2px solid #00d8ff;
  border-radius: 2px;
  z-index: 10;
}

.resize-handle:hover {
  background-color: #00d8ff;
}

.resize-nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-n {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-w {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-e {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-s {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.line-control {
  background-color: transparent !important;
  border: none !important;
  padding: 0;
}

.line-display {
  width: 100%;
  height: 100%;
  background-color: #333;
}
</style>
