<template>
  <div class="section">
    <h3>打印控件</h3>
    <div class="printer-info">
      <p>Lodop地址: <code>http://127.0.0.1:8000/CLodopfuncs.js</code></p>
      <div v-if="scriptLoading" class="loading-status loading">
        <span class="spinner"></span> 正在加载打印控件...
      </div>
      <div v-else-if="scriptLoaded" class="loading-status success">
        ✓ 打印控件加载成功
      </div>
      <div v-else-if="loadError" class="loading-status error">
        ✗ {{ loadError }}
        <button class="btn btn-secondary btn-sm mt-2" @click="$emit('retry-load')">重试</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  scriptLoaded: {
    type: Boolean,
    default: false
  },
  scriptLoading: {
    type: Boolean,
    default: false
  },
  loadError: {
    type: String,
    default: ''
  }
})

defineEmits(['retry-load'])
</script>