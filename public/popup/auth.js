let isLoginMode = true;
let captchaIdent = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupFormListeners();
  refreshCaptcha();
});

async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，跳转到主界面
      window.location.href = 'popup.html';
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
  }
}

function setupFormListeners() {
  document.getElementById('auth-form').addEventListener('submit', handleSubmit);
  document.getElementById('btn-refresh-captcha').addEventListener('click', refreshCaptcha);
  document.getElementById('btn-toggle-mode').addEventListener('click', toggleAuthMode);
}

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit');
  const switchText = document.getElementById('switch-text');
  const confirmPasswordGroup = document.getElementById('confirm-password-group');
  
  if (isLoginMode) {
    subtitle.textContent = '欢迎登录您的账户';
    submitBtn.textContent = '登录';
    switchText.innerHTML = '还没有账户？<button type="button" class="link-btn" onclick="toggleAuthMode()">立即注册</button>';
    confirmPasswordGroup.style.display = 'none';
  } else {
    subtitle.textContent = '创建新账户开始使用';
    submitBtn.textContent = '注册';
    switchText.innerHTML = '已有账户？<button type="button" class="link-btn" onclick="toggleAuthMode()">立即登录</button>';
    confirmPasswordGroup.style.display = 'block';
  }
  
  // 清空验证码
  document.getElementById('captcha').value = '';
  refreshCaptcha();
}

async function refreshCaptcha() {
  try {
    const response = await fetch(CONFIG.API_BASE_URL + CONFIG.CAPTCHA.CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.code === 0) {
      captchaIdent = data.data.ident;
      // 生成验证码图片（假设后端返回的code是验证码内容，这里用文本显示）
      const captchaImg = document.getElementById('captcha-img');
      captchaImg.alt = `验证码: ${data.data.code}`;
      // 创建一个简单的验证码显示
      captchaImg.src = `data:image/svg+xml;base64,${btoa(`
        <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="60" y="25" font-family="monospace" font-size="20" text-anchor="middle" fill="#333">${data.data.code}</text>
        </svg>
      `)}`;
    } else {
      showMessage('获取验证码失败: ' + data.echo, 'error');
    }
  } catch (error) {
    console.error('获取验证码失败:', error);
    showMessage('网络错误，无法获取验证码', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const captcha = document.getElementById('captcha').value.trim();
  
  // 验证表单
  if (!username || !password || !captcha) {
    showMessage('请填写所有必填字段', 'error');
    return;
  }
  
  if (!isLoginMode && password !== confirmPassword) {
    showMessage('两次输入的密码不一致', 'error');
    return;
  }
  
  if (!captchaIdent) {
    showMessage('请先获取验证码', 'error');
    return;
  }
  
  const submitBtn = document.getElementById('auth-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = '处理中...';
  
  try {
    // 先验证验证码
    const captchaResponse = await fetch(CONFIG.API_BASE_URL + CONFIG.CAPTCHA.VERIFY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ident: captchaIdent,
        code: captcha
      })
    });
    
    const captchaData = await captchaResponse.json();
    
    if (captchaData.code !== 0) {
      showMessage('验证码错误: ' + captchaData.echo, 'error');
      refreshCaptcha();
      return;
    }
    
    // 验证码验证成功，执行登录/注册
    const apiUrl = CONFIG.API_BASE_URL + (isLoginMode ? CONFIG.AUTH.LOGIN : CONFIG.AUTH.REGISTER);
    const authResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });
    
    const authData = await authResponse.json();
    
    if (authData.code === 0) {
      // 保存用户数据
      const userData = {
        uid: authData.data.uid,
        username: username,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天有效期
      };
      
      // 登录成功才保存token
      if (isLoginMode && authData.data.token) {
        userData.token = authData.data.token;
      }
      
      await chrome.storage.local.set({
        vue_printer_user_data: userData
      });
      
      showMessage(isLoginMode ? '登录成功！' : '注册成功！', 'success');
      
      // 延迟跳转到主界面
      setTimeout(() => {
        window.location.href = 'popup.html';
      }, 1000);
    } else {
      showMessage(authData.echo || (isLoginMode ? '登录失败' : '注册失败'), 'error');
      refreshCaptcha();
    }
  } catch (error) {
    console.error('请求失败:', error);
    showMessage('网络错误，请稍后重试', 'error');
    refreshCaptcha();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isLoginMode ? '登录' : '注册';
  }
}

function showMessage(message, type) {
  const errorElement = document.getElementById('error-message');
  const successElement = document.getElementById('success-message');
  
  if (type === 'error') {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    successElement.style.display = 'none';
  } else {
    successElement.textContent = message;
    successElement.style.display = 'block';
    errorElement.style.display = 'none';
  }
  
  // 3秒后自动隐藏
  setTimeout(() => {
    errorElement.style.display = 'none';
    successElement.style.display = 'none';
  }, 3000);
}