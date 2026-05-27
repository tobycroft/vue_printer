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
          <label>用户名</label>
          <span class="info-value">{{ userInfo.username || '-' }}</span>
        </div>

        <div class="info-item">
          <label>昵称</label>
          <span v-if="!editing" class="info-value">{{ userInfo.nickname || '-' }}</span>
          <input v-else v-model="editForm.nickname" type="text" class="edit-input" placeholder="请输入昵称">
        </div>
      </div>

      <div class="action-buttons">
        <button v-if="!editing" class="edit-btn" @click="startEditing">编辑信息</button>
        <template v-else>
          <button class="save-btn" @click="saveChanges" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
          <button class="cancel-btn" @click="cancelEditing">取消</button>
        </template>
      </div>
    </div>

    <!-- 未登录提示 -->
    <div v-else class="not-login">
      <p>请先登录后查看用户信息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getUserInfoDetail, updateUserInfo } from '@/services/apiService'

const loading = ref(false)
const error = ref(null)
const userInfo = ref(null)
const editing = ref(false)
const saving = ref(false)

// 编辑表单
const editForm = ref({
  nickname: ''
})

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

// 开始编辑
const startEditing = () => {
  editing.value = true
  // 填充表单数据
  editForm.value = {
    nickname: userInfo.value.nickname || ''
  }
}

// 取消编辑
const cancelEditing = () => {
  editing.value = false
}

// 保存修改
const saveChanges = async () => {
  saving.value = true
  
  try {
    const nickname = editForm.value.nickname.trim()
    if (!nickname) {
      alert('昵称不能为空')
      saving.value = false
      return
    }
    
    // 调用更新接口
    const result = await updateUserInfo({ nickname })
    
    if (result.success) {
      // 更新本地数据
      userInfo.value.nickname = nickname
      editing.value = false
      // 显示成功提示
      alert('昵称更新成功')
    } else {
      alert(`更新失败: ${result.message || '未知错误'}`)
    }
  } catch (err) {
    console.error('更新用户信息失败:', err)
    alert('网络请求失败，请稍后重试')
  } finally {
    saving.value = false
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
  color: #f44336;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

/* 编辑样式 */
.edit-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  background: #2d2d2d;
  color: #ffffff;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: #66BB6A;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #3d3d3d;
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-btn {
  background: #4CAF50;
  color: white;
}

.edit-btn:hover {
  background: #45a049;
}

.save-btn {
  background: #2196F3;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #1976D2;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
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
  display: flex;
  flex-direction: column;
  gap: 16px;
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
