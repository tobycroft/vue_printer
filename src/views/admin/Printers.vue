<template>
  <div class="printers-container">
    <div class="page-header">
      <h2>打印机管理</h2>
      <p>查看和管理所有打印机设备</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchPrinters">重试</button>
    </div>

    <!-- 打印机列表 -->
    <div v-else-if="printers.length > 0" class="printers-grid">
      <div v-for="printer in printers" :key="printer.id" class="printer-card">
        <div class="printer-header">
          <div class="printer-name">{{ printer.device }}</div>
          <div class="printer-status online">在线</div>
        </div>
        <div class="printer-info">
          <div class="info-item">
            <span class="label">设备ID:</span>
            <span class="value">{{ printer.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">地址:</span>
            <span class="value">{{ printer.url }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(printer.create_time) }}</span>
          </div>
          <div class="info-item">
            <span class="label">更新时间:</span>
            <span class="value">{{ formatDate(printer.update_time) }}</span>
          </div>
        </div>
        <div class="printer-actions">
          <button class="btn btn-primary" @click="viewPrinter(printer)">查看详情</button>
          <button class="btn btn-secondary" @click="testPrinter(printer)">测试打印</button>
        </div>
      </div>
    </div>

    <!-- 无打印机提示 -->
    <div v-else class="no-printers">
      <p>暂无打印机设备</p>
      <button class="btn btn-primary" @click="fetchPrinters">刷新</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPrinters } from '@/services/printerService'

const loading = ref(false)
const error = ref(null)
const printers = ref([])

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return dateStr
  }
}

// 获取打印机列表
const fetchPrinters = async () => {
  loading.value = true
  error.value = null
  printers.value = []

  try {
    const result = await getPrinters()
    
    if (result.success) {
      printers.value = result.data
    } else {
      error.value = result.message || '获取打印机列表失败'
    }
  } catch (err) {
    console.error('获取打印机列表失败:', err)
    error.value = '网络请求失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

// 查看打印机详情
const viewPrinter = (printer) => {
  console.log('查看打印机详情:', printer)
  // 可以跳转到详情页面或弹出详情对话框
}

// 测试打印机
const testPrinter = (printer) => {
  console.log('测试打印机:', printer)
  // 可以实现测试打印功能
}

onMounted(() => {
  fetchPrinters()
})
</script>

<style scoped>
.printers-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.page-header p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.error-icon {
  font-size: 48px;
  color: #ff4757;
  margin-bottom: 16px;
}

.error-state p {
  margin: 0 0 20px 0;
  color: #ff4757;
  font-size: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #ff3742;
}

/* 打印机网格 */
.printers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.printer-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.printer-card:hover {
  border-color: #00d8ff;
  transform: translateY(-2px);
}

.printer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.printer-name {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.printer-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.printer-status.online {
  background: #2ed573;
  color: white;
}

.printer-info {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item .label {
  color: #999;
}

.info-item .value {
  color: #ffffff;
  font-weight: 500;
}

.printer-actions {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-primary {
  background: #00d8ff;
  color: #1a1a1a;
}

.btn-primary:hover {
  background: #00b8e6;
}

.btn-secondary {
  background: #3d3d3d;
  color: white;
}

.btn-secondary:hover {
  background: #4d4d4d;
}

/* 无打印机状态 */
.no-printers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.no-printers p {
  margin: 0 0 20px 0;
  color: #999;
  font-size: 16px;
}
</style>