<template>
  <div class="local-printers-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h2>本地打印机</h2>
          <p>管理本地打印机和Lodop配置</p>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>Lodop端口配置</h3>
      <div class="config-form">
        <div class="form-group">
          <label for="port">端口</label>
          <input id="port" v-model.number="port" type="number" min="1" max="65535" class="form-control" placeholder="默认8000" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveConfig" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button class="btn btn-secondary" @click="testConnection" :disabled="testing">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
        </div>
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
      </div>
    </div>

    <div class="printers-section">
      <div class="section-header">
        <h3>本地打印机列表</h3>
        <button class="btn btn-primary" @click="showAddModal = true">
          <span class="btn-icon">➕</span>
          新增打印机
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="fetchPrinters">重试</button>
      </div>

      <div v-else-if="printers.length > 0" class="printers-grid">
        <div v-for="printer in printers" :key="printer.id" class="printer-card">
          <div class="printer-header">
            <div class="printer-name">{{ printer.device_name }}</div>
          </div>
          <div class="printer-info">
            <div class="info-item">
              <span class="label">设备ID:</span>
              <span class="value">{{ printer.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">电脑名:</span>
              <span class="value">{{ printer.computer_name }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(printer.create_time) }}</span>
            </div>
            <div v-if="printer.remark" class="info-item">
              <span class="label">备注:</span>
              <span class="value">{{ printer.remark }}</span>
            </div>
          </div>
          <div class="printer-actions">
            <button class="btn btn-secondary btn-sm" @click="editPrinter(printer)">修改</button>
            <button class="btn btn-danger btn-sm" @click="deletePrinter(printer.id)">删除</button>
          </div>
        </div>
      </div>

      <div v-else class="no-printers">
        <p>暂无本地打印机</p>
        <button class="btn btn-primary" @click="fetchPrinters">刷新</button>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>新增打印机</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="device-name">打印机名称</label>
            <input id="device-name" v-model="addForm.deviceName" type="text" placeholder="请输入打印机名称" class="form-control" />
          </div>
          <div class="form-group">
            <label for="device-remark">备注</label>
            <input id="device-remark" v-model="addForm.remark" type="text" placeholder="可选" class="form-control" />
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

    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>修改打印机</h3>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-device-name">打印机名称</label>
            <input id="edit-device-name" v-model="editForm.deviceName" type="text" placeholder="请输入打印机名称" class="form-control" />
          </div>
          <div class="form-group">
            <label for="edit-device-remark">备注</label>
            <input id="edit-device-remark" v-model="editForm.remark" type="text" placeholder="可选" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn btn-primary" @click="updatePrinter" :disabled="updating">
            {{ updating ? '更新中...' : '确认更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDeviceConfig, saveDeviceConfig, getLocalDevices, addLocalDevice, updateLocalDevice, deleteLocalDevice } from '@/services/printerService'

const loading = ref(false)
const error = ref(null)
const printers = ref([])
const port = ref(8000)
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const adding = ref(false)
const updating = ref(false)
const editingPrinterId = ref(null)

const addForm = reactive({
  deviceName: '',
  remark: ''
})

const editForm = reactive({
  deviceName: '',
  remark: ''
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return dateStr
  }
}

const loadConfig = async () => {
  try {
    const result = await getDeviceConfig()
    if (result.success) {
      port.value = result.data.port || 8000
    }
  } catch (err) {
    console.error('加载配置失败:', err)
  }
}

const saveConfig = async () => {
  if (!port.value || port.value < 1 || port.value > 65535) {
    alert('请输入有效的端口号(1-65535)')
    return
  }

  saving.value = true
  try {
    const result = await saveDeviceConfig(port.value)
    if (result.success) {
      alert('保存配置成功')
    } else {
      alert(result.message || '保存配置失败')
    }
  } catch (err) {
    console.error('保存配置失败:', err)
    alert('网络请求失败，请检查网络连接')
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  testing.value = true
  testResult.value = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`http://127.0.0.1:${port.value}/CLodopfuncs.js`, {
      method: 'GET',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      testResult.value = { success: true, message: '连接成功！Lodop服务正常运行' }
    } else {
      testResult.value = { success: false, message: '连接失败，请检查Lodop服务是否运行' }
    }
  } catch (err) {
    console.error('测试连接失败:', err)
    testResult.value = { success: false, message: '连接失败，请检查Lodop服务是否运行' }
  } finally {
    testing.value = false
  }
}

const fetchPrinters = async () => {
  loading.value = true
  error.value = null
  printers.value = []

  try {
    const result = await getLocalDevices()
    console.log('fetchPrinters result:', result)
    
    if (result.success) {
      printers.value = result.data
      console.log('printers:', printers.value)
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

const addPrinter = async () => {
  if (!addForm.deviceName.trim()) {
    alert('请输入打印机名称')
    return
  }

  adding.value = true
  try {
    const result = await addLocalDevice(addForm.deviceName.trim(), addForm.remark.trim())
    if (result.success) {
      alert('添加打印机成功')
      showAddModal.value = false
      addForm.deviceName = ''
      addForm.remark = ''
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

const editPrinter = (printer) => {
  console.log('editPrinter called with:', printer)
  editingPrinterId.value = printer.id
  editForm.deviceName = printer.deviceName || printer.DeviceName || ''
  editForm.remark = printer.remark || printer.Remark || ''
  console.log('editForm after:', editForm)
  showEditModal.value = true
}

const updatePrinter = async () => {
  if (!editForm.deviceName || !editForm.deviceName.trim()) {
    alert('请输入打印机名称')
    return
  }

  updating.value = true
  try {
    const result = await updateLocalDevice(editingPrinterId.value, editForm.deviceName.trim(), (editForm.remark || '').trim())
    if (result.success) {
      alert('更新成功')
      showEditModal.value = false
      await fetchPrinters()
    } else {
      alert(result.message || '更新失败')
    }
  } catch (error) {
    console.error('更新失败:', error)
    alert('更新失败，请稍后重试')
  } finally {
    updating.value = false
  }
}

const deletePrinter = async (id) => {
  if (!confirm('确定要删除该打印机吗？')) {
    return
  }

  try {
    const result = await deleteLocalDevice(id)
    if (result.success) {
      alert('删除打印机成功')
      await fetchPrinters()
    } else {
      alert(result.message || '删除打印机失败')
    }
  } catch (err) {
    console.error('删除打印机失败:', err)
    alert('网络请求失败，请检查网络连接')
  }
}

onMounted(() => {
  loadConfig()
  fetchPrinters()
})
</script>

<style scoped>
.local-printers-container {
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

.config-section {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.config-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}

.form-control {
  padding: 10px 14px;
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  border-color: #00d8ff;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.test-result {
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
}

.test-result.success {
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  border: 1px solid #2ed573;
}

.test-result.error {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  border: 1px solid #ff4757;
}

.printers-section {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #00d8ff;
  color: #1a1a1a;
}

.btn-primary:hover:not(:disabled) {
  background: #00b8e6;
}

.btn-secondary {
  background: #3d3d3d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4d4d4d;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff3742;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-icon {
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
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

.printers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.printer-card {
  background: #1a1a1a;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.printer-card:hover {
  border-color: #00d8ff;
}

.printer-header {
  margin-bottom: 12px;
}

.printer-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.printer-info {
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.info-item .label {
  color: #999;
}

.info-item .value {
  color: #ffffff;
}

.printer-actions {
  display: flex;
  gap: 8px;
}

.no-printers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.no-printers p {
  margin: 0 0 20px 0;
  color: #999;
  font-size: 16px;
}

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
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  margin: 20px;
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
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #3d3d3d;
}
</style>
