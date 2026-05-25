// 工具函数模块

// 清除本地登录数据
async function clearAuthData() {
  try {
    await chrome.storage.local.remove('vue_printer_user_data');
  } catch (error) {
    console.error('清除登录数据失败:', error);
  }
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

// 显示消息提示
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

// 检查登录状态
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