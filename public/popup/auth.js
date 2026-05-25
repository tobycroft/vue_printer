let isLoginMode = true;
let captchaIdent = null;

// 初始化调试面板
function initDebugPanel() {
  const apiUrl = CONFIG.API_BASE_URL + CONFIG.CAPTCHA.CREATE;
  document.getElementById('debug-api-url').textContent = apiUrl;
  document.getElementById('debug-status').textContent = '初始化中...';
  document.getElementById('debug-error').textContent = '-';
  document.getElementById('debug-mode').textContent = isLoginMode ? '登录' : '注册';
}

// 更新调试面板状态
function updateDebugPanel(status, error = '-', mode = '正常') {
  const statusEl = document.getElementById('debug-status');
  const errorEl = document.getElementById('debug-error');
  const modeEl = document.getElementById('debug-mode');
  
  statusEl.textContent = status;
  statusEl.className = 'status-value' + (status.includes('失败') || status.includes('错误') ? ' error' : '');
  
  errorEl.textContent = error || '-';
  modeEl.textContent = mode;
}

document.addEventListener('DOMContentLoaded', () => {
  initDebugPanel();
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
  
  // 显示加载状态
  showCaptchaLoading();
  
  console.log('验证码服务地址:', apiUrl);
  updateDebugPanel('连接中...', '-', '获取验证码');
  
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      console.log(`尝试连接验证码服务 (重试${retry}): ${apiUrl}`);
      
      // 打印请求信息
      console.log('=== 请求信息 ===');
      console.log('请求URL:', apiUrl);
      console.log('请求方法:', 'POST');
      console.log('请求模式:', 'cors');
      console.log('时间:', new Date().toISOString());
      
      const response = await fetchWithTimeout(apiUrl, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      // 打印完整响应信息
      console.log('=== 响应信息 ===');
      console.log('状态码:', response.status);
      console.log('状态文本:', response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        // 尝试读取响应体了解具体错误
        let errorBody = '无法读取响应体';
        try {
          errorBody = await response.text();
          console.log('错误响应体:', errorBody);
        } catch (e) {
          console.log('读取错误响应体失败:', e.message);
        }
        const errMsg = `HTTP错误: ${response.status} - ${errorBody}`;
        console.log(errMsg);
        
        if (retry >= maxRetries) {
          updateDebugPanel('连接失败', errMsg, '测试模式');
        }
        if (retry < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      // 先尝试读取文本，确认响应格式
      let responseText;
      try {
        responseText = await response.text();
        console.log('响应文本:', responseText);
      } catch (e) {
        console.log('读取响应文本失败:', e.message);
        if (retry >= maxRetries) {
          updateDebugPanel('解析失败', '无法读取响应内容', '测试模式');
        }
        if (retry < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      // 尝试解析JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('解析后的JSON:', data);
      } catch (e) {
        console.log('JSON解析失败:', e.message);
        console.log('响应不是有效JSON，内容:', responseText);
        if (retry >= maxRetries) {
          updateDebugPanel('解析失败', '响应不是有效JSON', '测试模式');
        }
        if (retry < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        continue;
      }
      
      if (data.code === 0) {
        // 打印完整的返回数据结构，帮助调试
        console.log('=== 数据结构检查 ===');
        console.log('data.data:', data.data);
        console.log('data.data 类型:', typeof data.data);
        console.log('data.data 的所有键:', data.data ? Object.keys(data.data) : 'undefined');
        
        // 检查数据是否存在
        if (!data.data) {
          const errMsg = 'data.data 不存在';
          console.log(errMsg);
          if (retry >= maxRetries) {
            updateDebugPanel('获取失败', errMsg, '测试模式');
          }
          if (retry < maxRetries) {
            console.log(`等待 ${retryDelay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          continue;
        }
        
        // 检查验证码标识和图片是否存在
        const ident = data.data.ident || data.data.id || data.data.uuid || null;
        const captchaImage = data.data.image || data.data.img || null;
        
        console.log('识别到的 ident:', ident);
        console.log('识别到的 image:', captchaImage ? '存在(base64)' : '不存在');
        
        if (!ident || !captchaImage) {
          const errMsg = `数据格式错误 - 需要 ident 和 image，但得到: ${JSON.stringify(data.data)}`;
          console.log(errMsg);
          
          if (retry >= maxRetries) {
            updateDebugPanel('获取失败', errMsg, '测试模式');
          }
          if (retry < maxRetries) {
            console.log(`等待 ${retryDelay}ms 后重试...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          continue;
        }
        
        captchaIdent = ident;
        
        console.log('获取验证码成功:', { ident: captchaIdent, imageLength: captchaImage.length });
        updateDebugPanel('连接成功', '-', '正常模式');
        
        // 使用后端返回的图片
        const captchaImg = document.getElementById('captcha-img');
        captchaImg.alt = '验证码图片';
        captchaImg.src = `data:image/png;base64,${captchaImage}`;
        
        // 隐藏加载状态，显示图片
        hideCaptchaLoading();
        
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) errorMsg.textContent = '';
        
        return;
      } else {
        const errorMsg = data.echo || '验证码服务返回错误';
        console.log(`验证码接口返回错误: ${errorMsg}`);
        
        if (retry >= maxRetries) {
          updateDebugPanel('验证失败', errorMsg, '测试模式');
          showMessage(`验证码获取失败: ${errorMsg}，使用本地测试模式`, 'error');
        } else {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      const errMsg = error.message;
      console.log(`连接失败 (${apiUrl}): ${errMsg}`);
      
      if (retry >= maxRetries) {
        updateDebugPanel('连接失败', errMsg, '测试模式');
        showMessage(`连接失败: ${errMsg}，使用本地测试模式`, 'error');
      } else {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('验证码服务无法连接');
  updateDebugPanel('服务不可达', '所有尝试均失败', '测试模式');
  captchaIdent = 'test-ident';
  const captchaImg = document.getElementById('captcha-img');
  captchaImg.alt = '测试验证码: 1234';
  captchaImg.src = `data:image/svg+xml;base64,${btoa(`
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="60" y="25" font-family="monospace" font-size="20" text-anchor="middle" fill="#333">1234</text>
    </svg>
  `)}`;
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