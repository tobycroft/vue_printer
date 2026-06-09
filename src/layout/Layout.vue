<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">🖨️</div>
        <h2>Vue Printer</h2>
        <div class="version">v1.0.0</div>
      </div>
      <nav class="menu">
        <router-link 
          v-for="menu in menus" 
          :key="menu.path"
          :to="menu.path"
          class="menu-item"
          :class="{ active: $route.path === menu.path }"
        >
          <span class="menu-icon">{{ menu.icon }}</span>
          <span class="menu-text">{{ menu.title }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <p>© 2026 Vue Printer</p>
      </div>
    </aside>

    <main class="content-wrapper">
      <header class="content-header">
        <h1>{{ $route.meta.title }}</h1>
        <div class="header-status">
          <div class="status-item" :class="wsStatus.class" :title="wsStatus.tooltip">
            <span class="status-dot"></span>
            <span class="status-text">{{ wsStatus.text }}</span>
          </div>
          <button v-if="wsStatus.state === 'disconnected'" class="btn-reconnect" @click="reconnectWebSocket">
            重新连接
          </button>
        </div>
      </header>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// WebSocket 状态
const wsStatus = ref({
  state: 'disconnected',
  class: 'disconnected',
  text: '未连接',
  tooltip: 'WebSocket 未连接'
})

// 获取 WebSocket 状态
async function checkWebSocketState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'wsGetState' })
    if (response) {
      updateWsStatus(response.state)
    }
  } catch (error) {
    updateWsStatus('disconnected')
  }
}

// 尝试连接 WebSocket
async function tryConnectWebSocket() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data')
    const userData = result.vue_printer_user_data
    if (userData && Date.now() < userData.expiresAt) {
      await chrome.runtime.sendMessage({ action: 'wsConnect' })
    }
  } catch (error) {
    console.error('[Layout] 连接 WebSocket 失败:', error)
  }
}

// 更新 WebSocket 状态显示
function updateWsStatus(state) {
  switch (state) {
    case 'connected':
      wsStatus.value = {
        state: 'connected',
        class: 'connected',
        text: '实时推送已连接',
        tooltip: 'WebSocket 连接正常'
      }
      break
    case 'connecting':
      wsStatus.value = {
        state: 'connecting',
        class: 'connecting',
        text: '连接中...',
        tooltip: '正在建立 WebSocket 连接'
      }
      break
    case 'disconnected':
    default:
      wsStatus.value = {
        state: 'disconnected',
        class: 'disconnected',
        text: '实时推送未连接',
        tooltip: 'WebSocket 未连接，点击重新连接'
      }
  }
}

// 重新连接 WebSocket
async function reconnectWebSocket() {
  try {
    updateWsStatus('connecting')
    await chrome.runtime.sendMessage({ action: 'wsConnect' })
  } catch (error) {
    console.error('[Layout] 重新连接 WebSocket 失败:', error)
    updateWsStatus('disconnected')
  }
}

// 监听 WebSocket 状态变化
function setupWebSocketListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'websocketStateChange') {
      updateWsStatus(message.state)
    }
    return false
  })
}

onMounted(() => {
  checkWebSocketState()
  setupWebSocketListener()
  tryConnectWebSocket()
})

const menus = ref([
  { path: '/admin/home', title: '首页', icon: '🏠' },
  { path: '/admin/userinfo', title: '用户信息', icon: '👤' },
  { path: '/admin/local-printers', title: '本地打印机', icon: '🖨️' },
  { path: '/admin/printers', title: '所有打印机', icon: '📋' },
  { path: '/admin/templates', title: '打印模板管理', icon: '📄' },
  { path: '/admin/system-settings', title: '系统设置', icon: '⚙️' },
  { path: '/admin/websocket-log', title: 'WebSocket 日志', icon: '📡' },
  { path: '/admin/about', title: '关于', icon: 'ℹ️' }
])
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #1a1a1a;
  margin: 0;
  padding: 0;
}

.sidebar {
  width: 260px;
  min-width: 260px;
  background: #2d2d2d;
  color: #e0e0e0;
  border-right: 1px solid #3d3d3d;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  margin: 0;
  position: relative;
  left: 0;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.sidebar-header h2 {
  margin: 0 0 5px 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.version {
  font-size: 12px;
  color: #999;
}

.menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: #b0b0b0;
  text-decoration: none;
  transition: all 0.2s;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  background: #252525;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: #353535;
  color: #ffffff;
}

.menu-item.active {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: #ffffff;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.menu-icon {
  margin-right: 12px;
  font-size: 18px;
}

.menu-text {
  font-size: 15px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #3d3d3d;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: #1a1a1a;
  margin: 0;
  padding: 0;
}

.content-header {
  padding: 30px 50px;
  background: #1a1a1a;
  border-bottom: 1px solid #3d3d3d;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.status-item.connected {
  background: rgba(76, 175, 80, 0.15);
  color: #4CAF50;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-item.connecting {
  background: rgba(255, 152, 0, 0.15);
  color: #FF9800;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-item.disconnected {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-item.connected .status-dot {
  background: #4CAF50;
}

.status-item.connecting .status-dot {
  background: #FF9800;
  animation: pulse 1s infinite;
}

.status-item.disconnected .status-dot {
  background: #f44336;
  animation: none;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.btn-reconnect {
  padding: 8px 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reconnect:hover {
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-reconnect:active {
  transform: translateY(0);
}

.content-body {
  flex: 1;
  padding: 40px 50px;
  overflow-y: auto;
  width: 100%;
  min-height: 0;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4d4d4d;
}
</style>