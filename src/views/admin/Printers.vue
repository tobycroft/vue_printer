<template>
  <div class="printers-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h2>打印机管理</h2>
          <p>查看和管理所有打印机设备</p>
        </div>
        <button class="btn btn-primary" @click="showAddModal = true">
          <span class="btn-icon">➕</span>
          新增打印机
        </button>
      </div>
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
        <button class="btn btn-secondary" @click="showEditModal(printer)">编辑</button>
        <button class="btn btn-danger" @click="deletePrinter(printer.id)">删除</button>
      </div>
      </div>
    </div>

    <!-- 无打印机提示 -->
    <div v-else class="no-printers">
      <p>暂无打印机设备</p>
      <button class="btn btn-primary" @click="fetchPrinters">刷新</button>
    </div>

    <!-- 新增打印机弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增打印机</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="device-name">打印机名称</label>
            <input
              id="device-name"
              v-model="addForm.device"
              type="text"
              placeholder="请输入打印机名称"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="device-url">打印机地址</label>
            <input
              id="device-url"
              v-model="addForm.url"
              type="text"
              placeholder="例如: http://192.168.1.100:8080"
              class="form-control"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn btn-primary" @click="addPrinter" :disabled="adding">
            {{ adding ? '添加中...' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑打印机弹窗 -->
    <div v-if="showEditModalRef.value" class="modal-overlay" @click.self="showEditModalRef.value = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑打印机</h3>
          <button class="close-btn" @click="showEditModalRef.value = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-device-name">打印机名称</label>
            <input
              id="edit-device-name"
              v-model="editForm.device"
              type="text"
              placeholder="请输入打印机名称"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="edit-device-url">打印机地址</label>
            <input
              id="edit-device-url"
              v-model="editForm.url"
              type="text"
              placeholder="例如: http://192.168.1.100:8080"
              class="form-control"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModalRef.value = false">取消</button>
          <button class="btn btn-primary" @click="editPrinter" :disabled="editing">
            {{ editing ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPrinters, addPrinterDevice, updatePrinterDevice, deletePrinterDevice } from '@/services/printerService'

const loading = ref(false)
const error = ref(null)
const printers = ref([])

// 无打印机状态
const noPrinters = ref(false)

// 新增打印机弹窗
const showAddModal = ref(false)
const addForm = reactive({
  device: '',
  url: ''
})
const adding = ref(false)

// 编辑打印机弹窗
const showEditModalRef = ref(false)
const editForm = reactive({
  id: '',
  device: '',
  url: ''
})
const editing = ref(false)

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

// 显示编辑弹窗
const showEditModal = (printer) => {
  editForm.id = printer.id
  editForm.device = printer.device
  editForm.url = printer.url
  showEditModalRef.value = true
}

// 删除打印机
const deletePrinter = async (id) => {
  if (!confirm('确定要删除该打印机吗？')) {
    return
  }

  try {
    const result = await deletePrinterDevice(id)
    
    if (result.success) {
      alert('打印机删除成功')
      // 刷新打印机列表
      await fetchPrinters()
    } else {
      alert(result.message || '删除打印机失败')
    }
  } catch (err) {
    console.error('删除打印机失败:', err)
    alert('网络请求失败，请检查网络连接')
  }
}

// 新增打印机
const addPrinter = async () => {
  if (!addForm.device.trim() || !addForm.url.trim()) {
    alert('请填写完整信息')
    return
  }

  adding.value = true
  try {
    const result = await addPrinterDevice(addForm)
    
    if (result.success) {
      alert('打印机添加成功')
      showAddModal.value = false
      // 重置表单
      addForm.device = ''
      addForm.url = ''
      // 刷新打印机列表
      await fetchPrinters()
    } else {
      alert(result.message || '添加打印机失败')
    }
  } catch (err) {
    console.error('添加打印机失败:', err)
    alert('网络请求失败，请检查网络连接')
  } finally {
    adding.value = false
  }
}

// 编辑打印机
const editPrinter = async () => {
  if (!editForm.device.trim() || !editForm.url.trim()) {
    alert('请填写完整信息')
    return
  }

  editing.value = true
  try {
    const result = await updatePrinterDevice(editForm)
    
    if (result.success) {
      alert('打印机修改成功')
      showEditModalRef.value = false
      // 刷新打印机列表
      await fetchPrinters()
    } else {
      alert(result.message || '修改打印机失败')
    }
  } catch (err) {
    console.error('修改打印机失败:', err)
    alert('网络请求失败，请检查网络连接')
  } finally {
    editing.value = false
  }
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

.page-header .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.page-header .header-text {
  flex: 1;
  min-width: 0;
}

.page-header .header-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-header .header-text p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.page-header .btn {
  padding: 6px 12px;
  background: #00d8ff;
  color: #1a1a1a;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.page-header .btn:hover {
  background: #00b8e6;
}

.page-header .btn-icon {
  font-size: 14px;
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
  gap: 8px;
  flex-wrap: wrap;
}

.printer-actions .btn {
  flex: 1;
  min-width: 80px;
  font-size: 12px;
  padding: 6px 8px;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover {
  background: #ff3742;
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #3d3d3d;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #00d8ff;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #3d3d3d;
}
</style>