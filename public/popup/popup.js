document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupEventListeners();
  await updateStatusDisplay();
});

// 获取用户信息
async function getUserInfo(userData) {
  if (!userData || !userData.token || !userData.uid) {
    return null;
  }
  
  try {
    const apiUrl = 'http://127.0.0.1' + '/v1/user/info/';
    
    // 根据文档，用户信息接口是POST请求，使用multipart/form-data
    const formData = new FormData();
    formData.append('uid', userData.uid);
    formData.append('token', userData.token);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    console.log('用户信息接口响应:', data);
    
    if (data.code === 0 && data.data) {
      console.log('解析到的用户数据:', data.data);
      return data.data;
    }
    
    console.log('用户信息接口返回错误:', data.code, data.echo);
    return null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

async function checkAuthStatus() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (!userData || Date.now() > userData.expiresAt) {
      // 未登录或Token过期，跳转到登录界面
      window.location.href = 'auth.html';
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    window.location.href = 'auth.html';
  }
}

function setupEventListeners() {
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
}

async function updateStatusDisplay() {
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
  
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 尝试获取用户信息
      const userInfo = await getUserInfo(userData);
      
      console.log('用户信息:', userInfo);
      console.log('本地用户数据:', userData);
      
      if (userInfo) {
        // 检查返回的数据结构
        if (userInfo.username) {
          // 如果获取到用户名，显示用户名
          userStatusText.textContent = `已登录: ${userInfo.username}`;
          // 更新本地存储的用户名
          if (userData.username !== userInfo.username) {
            userData.username = userInfo.username;
            await chrome.storage.local.set({ vue_printer_user_data: userData });
          }
        } else if (typeof userInfo === 'object') {
          // 如果是对象但没有username字段，显示所有键值对
          const userInfoStr = Object.entries(userInfo).map(([key, value]) => `${key}: ${value}`).join(', ');
          userStatusText.textContent = `已登录: ${userInfoStr}`;
        } else {
          // 如果是其他类型，直接显示
          userStatusText.textContent = `已登录: ${userInfo}`;
        }
      } else if (userData.username) {
        // 如果本地有用户名缓存，显示缓存的用户名
        userStatusText.textContent = `已登录: ${userData.username}`;
      } else {
        // 否则只显示已登录
        userStatusText.textContent = '已登录';
      }
      
      userStatus.className = 'status-icon connected';
    } else {
      userStatusText.textContent = '未登录';
      userStatus.className = 'status-icon disconnected';
    }
  } catch (error) {
    console.error('更新用户状态失败:', error);
    userStatusText.textContent = '已登录';
    userStatus.className = 'status-icon connected';
  }
}

async function openSettings() {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，在新标签页打开管理后台页面
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
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
