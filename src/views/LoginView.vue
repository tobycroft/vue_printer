<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ isLoginMode ? '登录' : '注册' }}</h1>
        <p>{{ isLoginMode ? '欢迎回来，请登录您的账户' : '创建新账户开始使用' }}</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="auth-form">
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
        
        <div class="form-group" v-if="!isLoginMode">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
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
              <img :src="captchaUrl" alt="验证码" />
            </button>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? '处理中...' : (isLoginMode ? '登录' : '注册') }}
          </button>
        </div>
      </form>
      
      <div class="auth-switch">
        <p>
          {{ isLoginMode ? '还没有账户？' : '已有账户？' }}
          <button type="button" class="link-btn" @click="toggleMode">
            {{ isLoginMode ? '立即注册' : '立即登录' }}
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

const isLoginMode = ref(true);
const isSubmitting = ref(false);
const captchaUrl = ref('');

const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  captcha: ''
});

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  formData.captcha = '';
  refreshCaptcha();
};

const refreshCaptcha = () => {
  // 这里应该调用后端接口获取验证码
  captchaUrl.value = `https://your-api-url/captcha?timestamp=${Date.now()}`;
};

const handleSubmit = async () => {
  if (!isLoginMode.value && formData.password !== formData.confirmPassword) {
    alert('两次输入的密码不一致');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    const response = isLoginMode.value
      ? await authService.login(formData.username, formData.password, formData.captcha)
      : await authService.register(formData.username, formData.password, formData.captcha);
    
    if (response.success) {
      // 保存用户信息到安全存储
      await storageService.saveUserData({
        uid: response.data.uid,
        token: response.data.token,
        username: formData.username
      });
      
      // 登录成功后跳转到管理后台
      window.location.href = '/index.html#/admin/home'
    } else {
      alert(response.message || '操作失败');
      refreshCaptcha();
    }
  } catch (error) {
    console.error('登录/注册失败:', error);
    alert('网络错误，请稍后重试');
    refreshCaptcha();
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  refreshCaptcha();
});
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.auth-header h1 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.auth-header p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 14px;
}

.auth-form {
  margin-bottom: 30px;
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  padding: 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-btn img {
  width: 100%;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
}

.form-actions {
  margin-top: 30px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

.auth-switch p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;
}

.link-btn:hover {
  color: #764ba2;
}
</style>