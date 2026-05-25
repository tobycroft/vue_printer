let isLoginMode = true;
let captchaIdent = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupFormListeners();
  refreshCaptcha();
});

// 清除本地登录数据
async function clearAuthData() {
  try {
    await chrome.storage.local.remove('vue_printer_user_data');
  } catch (error) {
    console.error('清除登录数据失败:', error);
  }
}

async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (!userData || !userData.token || !userData.uid || Date.now() > userData.expiresAt) {
      // 未登录或缺少必要信息，停留在登录界面
      return;
    }
    
    // 已登录，跳转到主界面
    window.location.href = 'popup.html';
  } catch (error) {
    console.error('检查登录状态失败:', error);
    await clearAuthData();
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

// 带超时的fetch请求
async function fetchWithTimeout(url, options, timeout = CONFIG.TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 显示验证码加载状态
function showCaptchaLoading() {
  const loadingEl = document.getElementById('captcha-loading');
  const imageEl = document.getElementById('captcha-img');
  if (loadingEl) loadingEl.classList.remove('hidden');
  if (imageEl) imageEl.classList.remove('visible');
}

// 隐藏验证码加载状态，显示图片
function hideCaptchaLoading() {
  const loadingEl = document.getElementById('captcha-loading');
  const imageEl = document.getElementById('captcha-img');
  if (loadingEl) loadingEl.classList.add('hidden');
  if (imageEl) imageEl.classList.add('visible');
}

async function refreshCaptcha() {
  const maxRetries = 2;
  const retryDelay = 500;
  const apiUrl = CONFIG.API_BASE_URL + CONFIG.CAPTCHA.CREATE;
  
  showCaptchaLoading();
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const response = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        if (retry < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      let responseText;
      try {
        responseText = await response.text();
      } catch (e) {
        if (retry < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (retry < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      if (data.code === 0) {
        if (!data.data) {
          if (retry < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          continue;
        }
        
        const ident = data.data.ident || data.data.id || data.data.uuid || null;
        const captchaImage = data.data.image || data.data.img || null;
        
        if (!ident || !captchaImage) {
          if (retry < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          continue;
        }
        
        captchaIdent = ident;
        
        const captchaImg = document.getElementById('captcha-img');
        captchaImg.alt = '验证码图片';
        captchaImg.src = `data:image/png;base64,${captchaImage}`;
        
        hideCaptchaLoading();
        
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.textContent = '';
        
        return;
      } else {
        const errorMsg = data.echo || '验证码服务返回错误';
        if (retry >= maxRetries) {
          showMessage(`验证码获取失败: ${errorMsg}，使用本地测试模式`, 'error');
        } else {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      if (retry >= maxRetries) {
        showMessage(`连接失败: ${error.message}，使用本地测试模式`, 'error');
      } else {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  captchaIdent = 'test-ident';
  const captchaImg = document.getElementById('captcha-img');
  captchaImg.alt = '测试验证码: 1234';
  captchaImg.src = `data:image/svg+xml;base64,${btoa(`
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="60" y="25" font-family="monospace" font-size="20" text-anchor="middle" fill="#333">1234</text>
    </svg>
  `)}`;
  
  hideCaptchaLoading();
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
    // 检查ident是否有效
    if (captchaIdent !== 'test-ident' && (!captchaIdent || captchaIdent.trim() === '')) {
      showMessage('验证码标识无效，请刷新验证码', 'error');
      refreshCaptcha();
      return;
    }
    
    // 直接执行登录/注册，将验证码参数发送到后端接口
    const apiUrl = CONFIG.API_BASE_URL + (isLoginMode ? CONFIG.AUTH.LOGIN : CONFIG.AUTH.REGISTER);
    console.log(`正在调用${isLoginMode ? '登录' : '注册'}接口:`, apiUrl);
    
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('ident', captchaIdent);
    formData.append('code', captcha);
    
    console.log('请求参数:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const authResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });
    
    console.log('接口响应状态:', authResponse.status, authResponse.statusText);
    const authData = await authResponse.json();
    
    console.log('登录/注册响应:', authData);
    
    if (authData.code === 0) {
      // 保存用户数据
      const userData = {
        uid: authData.data.uid,
        username: username,
        token: authData.data.token || '',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天有效期
      };
      
      // 确保token和uid都存在
      if (!userData.uid || !userData.token) {
        showMessage('登录失败：缺少必要的认证信息', 'error');
        refreshCaptcha();
        return;
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