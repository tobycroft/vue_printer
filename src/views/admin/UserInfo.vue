<template>
  <div class="user-info-container">
    <div class="page-header">
      <h2>用户信息</h2>
      <p>查看和管理您的个人信息</p>
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
      <button class="retry-btn" @click="fetchUserInfo">重试</button>
    </div>

    <!-- 用户信息卡片 -->
    <div v-else-if="userInfo" class="info-card">
      <div class="avatar-section">
        <div class="avatar-placeholder">
          {{ userInfo.nickname ? userInfo.nickname.charAt(0).toUpperCase() : 'U' }}
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <label>用户ID</label>
          <span class="info-value">{{ userInfo.uid || '-' }}</span>
        </div>

        <div class="info-item">
          <label>昵称</label>
          <span class="info-value">{{ userInfo.nickname || '-' }}</span>
        </div>

        <div v-if="userInfo.username" class="info-item">
          <label>用户名</label>
          <span class="info-value">{{ userInfo.username }}</span>
        </div>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-else class="not-login">
      <p>请先登录后查看用户信息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserInfoDetail } from '@/services/apiService'

const loading = ref(false)
const error = ref(null)
const userInfo = ref(null)

// 格式化日期（备用）
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return dateStr
  }
}

// 获取用户详细信息
const fetchUserInfo = async () => {
  loading.value = true
  error.value = null
  userInfo.value = null

  try {
    // 从chrome.storage.local获取认证信息
    let uid = null
    
    // 尝试从chrome.storage获取
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('vue_printer_user_data', resolve)
      })
      
      if (result && result.vue_printer_user_data) {
        uid = result.vue_printer_user_data.uid
      }
    }
    
    // 如果chrome.storage中没有，尝试从localStorage获取（兼容旧版本）
    if (!uid) {
      const authInfo = JSON.parse(localStorage.getItem('auth_info') || '{}')
      uid = authInfo.uid
    }
    
    if (!uid) {
      error.value = '未登录'
      loading.value = false
      return
    }

    const result = await getUserInfoDetail(uid)
    
    if (result.success) {
      userInfo.value = result.data
    } else {
      error.value = result.message || '获取用户信息失败'
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
    error.value = '网络请求失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.user-info-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
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

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #3d3d3d;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  color: #999;
  font-size: 14px;
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
  text-align: center;
}

.error-icon {
  width: 60px;
  height: 60px;
  border: 2px solid #f44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #f44336;
  margin-bottom: 16px;
}

.error-state p {
  margin: 0 0 20px 0;
  color: #f44336;
  font-size: 14px;
}

.retry-btn {
  padding: 10px 24px;
  background: #4CAF50;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

/* 信息卡片 */
.info-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 600;
  color: white;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 8px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #ffffff;
  word-break: break-all;
}

/* 未登录状态 */
.not-login {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.not-login p {
  margin: 0;
  color: #999;
  font-size: 16px;
}
</style>
