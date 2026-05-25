document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupEventListeners();
  updateStatusDisplay();
});

// 验证用户信息是否有效
async function validateUserSession(userData) {
  if (!userData || !userData.token || !userData.uid) {
    return false;
  }
  
  try {
    const apiUrl = CONFIG.API_BASE_URL + CONFIG.AUTH.USER_INFO;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userData.token}`,
        'UID': userData.uid
      },
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    
    // 如果返回code为-1，表示未登录或token失效
    if (data.code === -1) {
      return false;
    }
    
    return data.code === 0;
  } catch (error) {
    console.error('验证用户会话失败:', error);
    return false;
  }
}

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
    
    // 检查是否有完整的登录数据
    if (!userData || !userData.token || !userData.uid) {
      window.location.href = 'auth.html';
      return;
    }
    
    // 检查Token是否过期
    if (Date.now() > userData.expiresAt) {
      await clearAuthData();
      window.location.href = 'auth.html';
      return;
    }
    
    // 调用用户信息接口验证会话有效性
    const isValid = await validateUserSession(userData);
    if (!isValid) {
      await clearAuthData();
      window.location.href = 'auth.html';
      return;
    }
    
  } catch (error) {
    console.error('检查登录状态失败:', error);
    await clearAuthData();
    window.location.href = 'auth.html';
  }
}

function setupEventListeners() {
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
}

function updateStatusDisplay() {
  // 固定显示已连接状态
  // 服务器连接状态
  const serverStatus = document.getElementById('server-status');
  const serverStatusText = document.getElementById('server-status-text');
  serverStatus.className = 'status-icon connected';
  serverStatusText.textContent = '已连接';
  
  // 打印服务状态
  const printerStatus = document.getElementById('printer-status');
  const printerStatusText = document.getElementById('printer-status-text');
  printerStatus.className = 'status-icon connected';
  printerStatusText.textContent = '运行正常';
  
  // 用户状态
  const userStatus = document.getElementById('user-status');
  const userStatusText = document.getElementById('user-status-text');
  userStatus.className = 'status-icon connected';
  userStatusText.textContent = '已登录';
}

async function openSettings() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，在新标签页打开管理后台页面
      chrome.tabs.create({ url: chrome.runtime.getURL('admin.html') });
    } else {
      // 未登录，跳转到登录页面
      window.location.href = 'auth.html';
    }
    window.close();
  } catch (error) {
    console.error('打开设置失败:', error);
    window.location.href = 'auth.html';
  }
}

async function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    try {
      await chrome.storage.local.remove('vue_printer_user_data');
      window.location.href = 'auth.html';
    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败，请稍后重试');
    }
  }
}
