document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  setupEventListeners();
  updateStatusDisplay();
});

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
      // 已登录，在新标签页打开配置页面
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
