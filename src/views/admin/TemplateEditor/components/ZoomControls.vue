<template>
  <div class="zoom-controls">
    <button class="btn btn-icon" @click="zoomOut" title="缩小">
      🔍−
    </button>
    <span class="zoom-value">{{ Math.round(zoom * 100) }}%</span>
    <button class="btn btn-icon" @click="zoomIn" title="放大">
      🔍+
    </button>
    <button class="btn btn-icon" @click="resetZoom" title="重置">
      ↺
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  zoom: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['zoom-in', 'zoom-out', 'reset-zoom'])

const zoomIn = () => {
  emit('zoom-in')
}

const zoomOut = () => {
  emit('zoom-out')
}

const resetZoom = () => {
  emit('reset-zoom')
}
</script>

<style scoped>
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #333;
  border-radius: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background-color: #444;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #555;
}

.btn-icon:active {
  background-color: #666;
}

.zoom-value {
  font-size: 14px;
  color: #fff;
  min-width: 50px;
  text-align: center;
  font-weight: 500;
}
</style>