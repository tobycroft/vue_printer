<template>
  <div class="section">
    <h3>控件列表</h3>
    <div class="widget-list">
      <div
        v-for="widget in widgets"
        :key="widget.type"
        class="widget-item"
        draggable="true"
        @dragstart="$emit('drag-start', $event, widget)"
      >
        <span class="widget-icon">{{ widget.icon }}</span>
        <span class="widget-name">{{ widget.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  widgets: {
    type: Array,
    required: true
  }
})

defineEmits(['drag-start'])
</script>