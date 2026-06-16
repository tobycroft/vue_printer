<template>
  <div class="pagination-bar">
    <button
      class="page-btn"
      @click="$emit('prev')"
      :disabled="!hasPrev || loading"
    >◀ 上一页</button>

    <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>

    <button
      class="page-btn"
      @click="$emit('next')"
      :disabled="!hasNext || loading"
    >下一页 ▶</button>

    <span class="page-sep">|</span>

    <select
      class="page-size"
      :value="String(pageSize)"
      @change="onSizeChange"
      :disabled="loading"
    >
      <option value="10">每页 10 条</option>
      <option value="20">每页 20 条</option>
      <option value="30">每页 30 条</option>
      <option value="50">每页 50 条</option>
    </select>

    <span class="page-sep">|</span>

    <input
      type="number"
      min="1"
      :max="totalPages"
      class="page-input"
      v-model="gotoInput"
      placeholder="跳转到"
      :disabled="loading"
      @keydown.enter="onGoto"
    />
    <button
      class="page-btn small"
      @click="onGoto"
      :disabled="loading"
    >跳转</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  hasPrev: { type: Boolean, default: false },
  hasNext: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['prev', 'next', 'sizeChange', 'goto'])

const gotoInput = ref('')

const onSizeChange = (e) => {
  emit('sizeChange', e.target.value)
}

const onGoto = () => {
  emit('goto', gotoInput.value)
  gotoInput.value = ''
}
</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid #BDBDBD;
  background: #fff;
  color: #333;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #E3F2FD;
  border-color: #1976D2;
  color: #1976D2;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.page-info {
  color: #555;
  font-size: 13px;
}

.page-sep {
  color: #ccc;
}

.page-size {
  padding: 6px 10px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.page-size:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

.page-input {
  padding: 6px 10px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  font-size: 13px;
  width: 70px;
  background: #fff;
  color: #333;
}

.page-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}
</style>
