<template>
  <div class="system-settings-container">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h2>系统设置</h2>
          <p>配置系统API连接地址</p>
        </div>
      </div>
    </div>

    <div class="config-section">
      <h3>API连接配置</h3>
      <div class="config-form">
        <div class="form-group">
          <label for="api-url">API地址</label>
          <input id="api-url" v-model="apiUrl" type="text" class="form-control" placeholder="例如：https://printapi.tuuz.ltd:444" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" @click="saveSettings" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <button class="btn btn-secondary" @click="testConnection" :disabled="testing">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
          <button class="btn btn-outline" @click="resetToDefault">
            恢复默认
          </button>
        </div>
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>当前配置信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">默认地址:</span>
          <span class="info-value">{{ DEFAULT_API_BASE_URL }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前地址:</span>
          <span class="info-value">{{ currentApiUrl }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">存储位置:</span>
          <span class="info-value">localStorage</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getApiBaseUrl, saveApiBaseUrl, DEFAULT_API_BASE_URL, checkServerConnectivity } from '@/services/apiService'

const apiUrl = ref('')
const saving = ref(false)
const testing = ref(false)
const testResult = ref(null)

const currentApiUrl = computed(() => apiUrl.value || DEFAULT_API_BASE_URL)

const loadSettings = () => {
  const savedUrl = getApiBaseUrl()
  apiUrl.value = savedUrl
}

const saveSettings = async () => {
  if (!apiUrl.value.trim()) {
    alert('请输入API地址')
    return
  }

  try {
    new URL(apiUrl.value.trim())
  } catch {
    alert('请输入有效的URL地址')
    return
  }

  saving.value = true
  try {
    saveApiBaseUrl(apiUrl.value.trim())
    alert('保存成功！刷新页面后生效')
    testResult.value = null
  } catch (err) {
    console.error('保存失败:', err)
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

const testConnection = async () => {
  if (!apiUrl.value.trim()) {
    alert('请先输入API地址')
    return
  }

  testing.value = true
  testResult.value = null

  try {
    const success = await checkServerConnectivity(5000, apiUrl.value.trim())
    if (success) {
      testResult.value = { success: true, message: '连接成功！API服务正常运行' }
    } else {
      testResult.value = { success: false, message: '连接失败，请检查API地址是否正确' }
    }
  } catch (err) {
    console.error('测试连接失败:', err)
    testResult.value = { success: false, message: '连接失败，请检查API地址是否正确' }
  } finally {
    testing.value = false
  }
}

const resetToDefault = () => {
  if (!confirm('确定要恢复到默认地址吗？')) {
    return
  }
  apiUrl.value = DEFAULT_API_BASE_URL
  testResult.value = null
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings-container {
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
  flex-wrap: wrap;
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

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
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

.btn-outline {
  background: transparent;
  border: 1px solid #3d3d3d;
  color: #999;
}

.btn-outline:hover:not(:disabled) {
  border-color: #00d8ff;
  color: #00d8ff;
}

.info-section {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
}

.info-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #1a1a1a;
  border-radius: 6px;
}

.info-label {
  font-size: 14px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
  max-width: 70%;
}
</style>
