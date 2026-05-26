<template>
  <div class="auth-container">
    <div class="auth-header">
      <h1>🖨️ Vue Printer</h1>
      <p>{{ authSubtitle }}</p>
    </div>

    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>

    <form class="auth-form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="formData.username"
          type="text"
          placeholder="请输入用户名"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="formData.password"
          type="password"
          placeholder="请输入密码"
          required
        />
      </div>
      
      <div v-if="!isLoginMode" class="form-group">
        <label for="confirm-password">确认密码</label>
        <input
          id="confirm-password"
          v-model="formData.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="captcha">验证码</label>
        <div class="captcha-group">
          <input
            id="captcha"
            v-model="formData.captcha"
            type="text"
            placeholder="请输入验证码"
            required
          />
          <button type="button" class="captcha-btn" @click="refreshCaptcha">
            <div v-if="captchaLoading" class="captcha-loading">获取中...</div>
            <div v-else-if="captchaFailed" class="captcha-failed">
              <span>获取失败</span>
              <span class="retry-hint">点击重试</span>
            </div>
            <img
              v-show="!captchaLoading && !captchaFailed && captchaImage"
              :src="captchaImage"
              alt="验证码"
              class="captcha-image"
            />
          </button>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? '处理中...' : (isLoginMode ? '登录' : '注册') }}
        </button>
      </div>
    </form>
    
    <div class="auth-switch">
      <p>
        {{ isLoginMode ? '还没有账户？' : '已有账户？' }}
        <button type="button" class="link-btn" @click="toggleAuthMode">
          {{ isLoginMode ? '立即注册' : '立即登录' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createCaptcha, loginWithForm, registerWithForm } from '@/services/apiService'

// API配置
const CONFIG = {
  TIMEOUT: 10000
}

// 状态
const isLoginMode = ref(true)
const submitting = ref(false)
const captchaLoading = ref(false)
const captchaFailed = ref(false)
const captchaIdent = ref(null)
const captchaImage = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
  captcha: ''
})

const authSubtitle = ref('欢迎登录您的账户')

onMounted(() => {
  checkAuthStatus()
  refreshCaptcha()
})

// 检查认证状态
async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data')
    const userData = result.vue_printer_user_data
    
    if (!userData || !userData.token || !userData.uid || Date.now() > userData.expiresAt) {
      return false
    }
    
    // 已登录，跳转到主界面
    window.location.href = 'popup.html'
    return true
  } catch (error) {
    console.error('检查登录状态失败:', error)
    await clearAuthData()
    return false
  }
}

// 清除认证数据
async function clearAuthData() {
  try {
    await chrome.storage.local.remove('vue_printer_user_data')
  } catch (error) {
    console.error('清除登录数据失败:', error)
  }
}

// 显示消息
function showMessage(message, type) {
  if (type === 'error') {
    errorMessage.value = message
    successMessage.value = ''
  } else {
    successMessage.value = message
    errorMessage.value = ''
  }
  
  setTimeout(() => {
    errorMessage.value = ''
    successMessage.value = ''
  }, 3000)
}

// 带超时的fetch（保留用于其他可能的用途）
async function fetchWithTimeout(url, options, timeout = CONFIG.TIMEOUT) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// 刷新验证码
async function refreshCaptcha() {
  // 重置失败状态
  captchaFailed.value = false
  captchaLoading.value = true
  
  try {
    const result = await createCaptcha(CONFIG.TIMEOUT)
    
    if (result.success && result.data) {
      captchaIdent.value = result.data.ident
      captchaImage.value = `data:image/png;base64,${result.data.image}`
      captchaLoading.value = false
      errorMessage.value = ''
    } else {
      captchaFailed.value = true
      captchaLoading.value = false
      showMessage(result.message || '获取验证码失败', 'error')
    }
  } catch (error) {
    captchaFailed.value = true
    captchaLoading.value = false
    showMessage('网络请求失败，请重试', 'error')
  }
}

// 切换登录/注册模式
function toggleAuthMode() {
  isLoginMode.value = !isLoginMode.value
  
  if (isLoginMode.value) {
    authSubtitle.value = '欢迎登录您的账户'
  } else {
    authSubtitle.value = '创建新账户开始使用'
  }
  
  // 清空验证码
  formData.value.captcha = ''
  refreshCaptcha()
}

// 提交表单
async function handleSubmit() {
  // 验证表单
  if (!formData.value.username || !formData.value.password || !formData.value.captcha) {
    showMessage('请填写所有必填字段', 'error')
    return
  }
  
  if (!isLoginMode.value && formData.value.password !== formData.value.confirmPassword) {
    showMessage('两次输入的密码不一致', 'error')
    return
  }
  
  if (!captchaIdent.value) {
    showMessage('请先获取验证码', 'error')
    return
  }
  
  submitting.value = true
  
  try {
    // 检查ident是否有效
    if (captchaIdent.value !== 'test-ident' && (!captchaIdent.value || captchaIdent.value.trim() === '')) {
      showMessage('验证码标识无效，请刷新验证码', 'error')
      refreshCaptcha()
      return
    }
    
    // 使用统一的API服务
    const authFunction = isLoginMode.value ? loginWithForm : registerWithForm
    const result = await authFunction(
      formData.value.username,
      formData.value.password,
      captchaIdent.value,
      formData.value.captcha
    )
    
    if (result.success) {
      // 保存用户数据
      const userData = {
        uid: result.data.uid,
        username: formData.value.username,
        token: result.data.token || '',
        expiresAt: result.data.expiresAt
      }
      
      if (!userData.uid || !userData.token) {
        showMessage('登录失败：缺少必要的认证信息', 'error')
        refreshCaptcha()
        return
      }
      
      await chrome.storage.local.set({
        vue_printer_user_data: userData
      })
      
      showMessage(isLoginMode.value ? '登录成功！' : '注册成功！', 'success')
      
      // 延迟跳转到主界面
      setTimeout(() => {
        window.location.href = 'popup.html'
      }, 1000)
    } else {
      showMessage(result.message || (isLoginMode.value ? '登录失败' : '注册失败'), 'error')
      refreshCaptcha()
    }
  } catch (error) {
    console.error('请求失败:', error)
    showMessage('网络错误，请稍后重试', 'error')
    refreshCaptcha()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.auth-container {
  width: 350px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f5f5;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.auth-header h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
}

.auth-header p {
  font-size: 13px;
  color: #666;
}

.auth-form {
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.captcha-group {
  display: flex;
  gap: 10px;
}

.captcha-group input {
  flex: 1;
}

.captcha-btn {
  width: 120px;
  height: 42px;
  padding: 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.captcha-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  z-index: 10;
}

.captcha-failed {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #ffebee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  z-index: 10;
}

.captcha-failed span:first-child {
  font-size: 12px;
  color: #c62828;
  font-weight: 500;
}

.retry-hint {
  font-size: 10px;
  color: #e57373;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.form-actions {
  margin-top: 30px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.auth-switch p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.link-btn {
  background: none;
  border: none;
  color: #4CAF50;
  font-weight: 600;
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;
}

.link-btn:hover {
  color: #45a049;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 13px;
}
</style>
