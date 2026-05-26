<template>
  <div class="popup-container">
    <div class="header">
      <h1>🖨️ Vue Printer</h1>
      <p>C-LODOP 打印服务</p>
    </div>

    <div class="status-container">
      <div class="status-item">
        <div :class="['status-icon', serverStatus.class]"></div>
        <div class="status-info">
          <div class="status-label">服务器连接</div>
          <div class="status-desc">{{ serverStatus.text }}</div>
        </div>
      </div>
      <div class="status-item">
        <div class="status-icon connected"></div>
        <div class="status-info">
          <div class="status-label">打印服务</div>
          <div class="status-desc">运行正常</div>
        </div>
      </div>
      <div class="status-item">
        <div :class="['status-icon', userStatus.class]"></div>
        <div class="status-info">
          <div class="status-label">用户状态</div>
          <div class="status-desc">{{ userStatus.text }}</div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="btn" @click="openSettings">打开设置</button>
      <button class="btn btn-secondary" @click="handleLogout">退出登录</button>
    </div>

    <div class="footer">
      <p class="footer-text">Vue Printer v1.0.0</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const serverStatus = ref({
  class: 'checking',
  text: '检查中...'
})

const userStatus = ref({
  class: 'checking',
  text: '检查中...'
})

onMounted(() => {
  checkAuthStatus()
  updateStatusDisplay()
})

// 检查认证状态
async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data')
    const userData = result.vue_printer_user_data
    
    if (!userData || Date.now() > userData.expiresAt) {
      // 未登录或Token过期，跳转到登录界面
      window.location.href = 'auth.html'
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    window.location.href = 'auth.html'
  }
}

// 检测服务器连通性
async function checkServerConnectivity() {
  try {
    await fetch('https://printapi.tuuz.ltd:444', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      timeout: 3000
    })
    return true
  } catch (error) {
    console.error('服务器连通性检测失败:', error)
    return false
  }
}

// 获取用户信息
async function getUserInfo(userData) {
  if (!userData || !userData.token || !userData.uid) {
    return null
  }
  
  try {
    const apiUrl = 'https://printapi.tuuz.ltd:444/v1/user/info/'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'uid': userData.uid,
        'token': userData.token
      },
      mode: 'cors',
      cache: 'no-cache'
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (data.code === 0 && data.data) {
      return data.data
    } else if (data.code === -1) {
      // code=-1表示未登录或token已过期，需要退出登录
      console.log('用户信息接口返回未登录，自动退出登录')
      await handleLogout(false)
      return null
    }
    
    return null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 更新状态显示
async function updateStatusDisplay() {
  // 服务器连接状态
  const isServerConnected = await checkServerConnectivity()
  if (isServerConnected) {
    serverStatus.value = {
      class: 'connected',
      text: '已连接'
    }
  } else {
    serverStatus.value = {
      class: 'disconnected',
      text: '未连接'
    }
  }
  
  // 用户状态
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data')
    const userData = result.vue_printer_user_data
    
    if (userData && Date.now() < userData.expiresAt) {
      // 尝试获取用户信息
      const userInfo = await getUserInfo(userData)
      
      if (userInfo) {
        if (userInfo.username) {
          userStatus.value = {
            class: 'connected',
            text: `已登录: ${userInfo.username}`
          }
          // 更新本地存储的用户名
          if (userData.username !== userInfo.username) {
            userData.username = userInfo.username
            await chrome.storage.local.set({ vue_printer_user_data: userData })
          }
        } else if (typeof userInfo === 'object') {
          const userInfoStr = Object.entries(userInfo).map(([key, value]) => `${key}: ${value}`).join(', ')
          userStatus.value = {
            class: 'connected',
            text: `已登录: ${userInfoStr}`
          }
        } else {
          userStatus.value = {
            class: 'connected',
            text: `已登录: ${userInfo}`
          }
        }
      } else if (userData.username) {
        userStatus.value = {
          class: 'connected',
          text: `已登录: ${userData.username}`
        }
      } else {
        userStatus.value = {
          class: 'connected',
          text: '已登录'
        }
      }
    } else {
      userStatus.value = {
        class: 'disconnected',
        text: '未登录'
      }
    }
  } catch (error) {
    console.error('更新用户状态失败:', error)
    userStatus.value = {
      class: 'connected',
      text: '已登录'
    }
  }
}

// 打开设置
async function openSettings() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data')
    const userData = result.vue_printer_user_data
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，在新标签页打开管理后台页面
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html#/admin/home') })
    } else {
      // 未登录，跳转到登录页面
      window.location.href = 'auth.html'
    }
    window.close()
  } catch (error) {
    console.error('打开设置失败:', error)
    window.location.href = 'auth.html'
  }
}

// 退出登录
async function handleLogout(showConfirm = true) {
  if (showConfirm && !confirm('确定要退出登录吗？')) {
    return
  }
  
  try {
    await chrome.storage.local.remove('vue_printer_user_data')
    window.location.href = 'auth.html'
  } catch (error) {
    console.error('退出登录失败:', error)
    if (showConfirm) {
      alert('退出登录失败，请稍后重试')
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.popup-container {
  width: 280px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.header h1 {
  font-size: 18px;
  margin-bottom: 5px;
}

.header p {
  font-size: 12px;
  opacity: 0.9;
}

.status-container {
  padding: 20px;
  background: white;
  margin: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-icon.connected {
  background: #4CAF50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.status-icon.disconnected {
  background: #f44336;
}

.status-icon.checking {
  background: #ff9800;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.status-desc {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.actions {
  padding: 0 15px 15px;
}

.btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  transition: background 0.2s;
  margin-bottom: 10px;
}

.btn:hover {
  background: #45a049;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.footer {
  padding: 10px 15px 15px;
  text-align: center;
}

.footer-text {
  font-size: 11px;
  color: #999;
}
</style>
