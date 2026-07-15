<template>
  <div class="section">
    <h3>控件列表</h3>
    <div class="widget-list">
      <template v-for="(group, index) in groupedWidgets" :key="index">
        <div v-if="group.label" class="widget-category-label">{{ group.label }}</div>
        <div
          v-for="widget in group.items"
          :key="widget.type + (widget.dataField || '')"
          class="widget-item"
          draggable="true"
          @dragstart="$emit('drag-start', $event, widget)"
        >
          <span class="widget-icon">{{ widget.icon }}</span>
          <span class="widget-name">{{ widget.name }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  widgets: {
    type: Array,
    required: true
  }
})

defineEmits(['drag-start'])

const groupedWidgets = computed(() => {
  const groups = []
  const basicWidgets = []
  const categoryMap = {}

  props.widgets.forEach(widget => {
    if (widget.category) {
      if (!categoryMap[widget.category]) {
        categoryMap[widget.category] = []
      }
      categoryMap[widget.category].push(widget)
    } else {
      basicWidgets.push(widget)
    }
  })

  // 基础控件
  if (basicWidgets.length > 0) {
    groups.push({ label: '基础控件', items: basicWidgets })
  }

  // 分类控件
  const categoryOrder = ['订单信息', '金额信息', '收货信息', '商品信息']
  categoryOrder.forEach(cat => {
    if (categoryMap[cat] && categoryMap[cat].length > 0) {
      groups.push({ label: cat, items: categoryMap[cat] })
    }
  })

  // 其他未在排序中的分类
  Object.keys(categoryMap).forEach(cat => {
    if (!categoryOrder.includes(cat) && categoryMap[cat].length > 0) {
      groups.push({ label: cat, items: categoryMap[cat] })
    }
  })

  return groups
})
</script>