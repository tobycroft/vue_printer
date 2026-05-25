<template>
  <div class="connection-container">
    <div class="connection-header">
      <h2>C-LODOP 连接</h2>
      <p>配置和检查 C-LODOP 打印服务连接状态</p>
    </div>

    <div class="connection-card">
      <div class="card-section">
        <h3>服务配置</h3>
        <div class="form-group">
          <label>C-LODOP 服务地址</label>
          <input 
            v-model="config.url" 
            type="text" 
            readonly
            class="form-control"
          />
        </div>
      </div>

      <div class="card-section">
        <h3>连接状态</h3>
        <div :class="['status-indicator', connectionStatus.class]">
          <div class="status-icon">{{ connectionStatus.icon }}</div>
          <div class="status-info">
            <div class="status-title">{{ connectionStatus.title }}</div>
            <div class="status-desc">{{ connectionStatus.description }}</div>
          </div>
        </div>
      </div>

      <div class="card-section">
        <h3>操作</h3>
        <button class="btn btn-primary" @click="checkConnection" :disabled="checking">
          {{ checking ? '检查中...' : '重新检查连接' }}
        </button>
      </div>
    </div>

    <div class="info-card">
      <h3>ℹ️ 使用说明</h3>
      <ul class="info-list">
        <li>确保已安装 C-LODOP 打印控件</li>
        <li>服务地址通常为: http://127.0.0.1:8000/CLodopfuncs.js</li>
        <li>如果连接失败，请检查 C-LODOP 是否正常运行</li>
        <li>C-LODOP 默认监听 8000 端口</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const config = ref({
  url: 'http://127.0.0.1:8000/CLodopfuncs.js'
})

const connectionStatus = ref({
  class: 'checking',
  icon: '⏳',
  title: '检查中...',
  description: '正在检测 C-LODOP 服务连接状态'
})

const checking = ref(false)

onMounted(() => {
  checkConnection()
})

const checkConnection = async () => {
  checking.value = true
  connectionStatus.value = {
    class: 'checking',
    icon: '',
    title: '检查中...',
    description: '正在检测 C-LODOP 服务连接状态'
  }

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLodopStatus' })
    
    if (response && response.installed) {
      connectionStatus.value = {
        class: 'connected',
        icon: '✅',
        title: '已连接',
        description: 'C-LODOP 服务运行正常，可以正常使用打印功能'
      }
    } else {
      connectionStatus.value = {
        class: 'disconnected',
        icon: '❌',
        title: '未连接',
        description: '未检测到 C-LODOP 服务，请确保已安装并启动'
      }
    }
  } catch (error) {
    console.error('检查连接失败:', error)
    connectionStatus.value = {
      class: 'error',
      icon: '️',
      title: '检查失败',
      description: '无法连接到 C-LODOP 服务，请检查服务是否正常运行'
    }
  } finally {
    checking.value = false
  }
}
</script>

<style scoped>
.connection-container {
  max-width: 800px;
  margin: 0 auto;
}

.connection-header {
  margin-bottom: 30px;
}

.connection-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.connection-header p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.connection-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 20px;
}

.card-section {
  margin-bottom: 30px;
}

.card-section:last-child {
  margin-bottom: 0;
}

.card-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #b0b0b0;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  font-size: 14px;
  color: #e0e0e0;
}

.status-indicator {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #252525;
  border-radius: 8px;
  border: 2px solid #3d3d3d;
}

.status-indicator.checking {
  border-color: #ff9800;
}

.status-indicator.connected {
  border-color: #4CAF50;
}

.status-indicator.disconnected {
  border-color: #f44336;
}

.status-indicator.error {
  border-color: #ff9800;
}

.status-icon {
  font-size: 32px;
  margin-right: 15px;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 5px;
}

.status-desc {
  font-size: 13px;
  color: #999;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.info-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
}

.info-card h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  color: #b0b0b0;
}

.info-list li {
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.info-list li:last-child {
  margin-bottom: 0;
}
</style>
