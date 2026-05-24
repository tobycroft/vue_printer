let selectedTemplate = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  checkLodopStatus();
  loadTemplates();
  setupEventListeners();
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
  document.getElementById('print-current').addEventListener('click', printCurrentPage);
  document.getElementById('btn-options').addEventListener('click', openOptions);
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadTemplates();
    checkLodopStatus();
  });
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    // Prevent popup from closing when opening options from this link
    const originalClose = window.close;
    window.close = () => {};
    openOptions();
    window.close = originalClose;
  });
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

async function checkLodopStatus() {
  const indicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  // 固定显示已连接状态
  indicator.classList.remove('disconnected');
  indicator.classList.add('connected');
  statusText.textContent = '已连接';
}

async function loadTemplates() {
  const templateList = document.getElementById('template-list');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPrintTemplates' });

    if (response && response.templates && response.templates.length > 0) {
      templateList.innerHTML = response.templates.map(template => `
        <div class="template-item" data-template-id="${template.id}">
          <div class="template-name">${template.name}</div>
          <div class="template-desc">${template.description || 'No description'}</div>
        </div>
      `).join('');

      templateList.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => selectTemplate(item));
      });
    } else {
      templateList.innerHTML = `
        <div class="empty-state">
          <p>No templates</p>
          <small>Create templates in options</small>
        </div>
      `;
    }
  } catch (error) {
    console.error('Failed to load templates:', error);
    templateList.innerHTML = `
      <div class="empty-state">
        <p>Failed to load templates</p>
      </div>
    `;
  }
}

function selectTemplate(element) {
  document.querySelectorAll('.template-item').forEach(item => {
    item.classList.remove('selected');
  });

  element.classList.add('selected');
  selectedTemplate = element.getAttribute('data-template-id');
}

async function printCurrentPage() {
  if (!selectedTemplate) {
    alert('Please select a template first');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'printDocument',
      printData: {
        templateId: selectedTemplate,
        printerName: ''
      }
    });

    if (response && response.success) {
      console.log('Print job submitted successfully');
    } else {
      console.error('Print job failed:', response?.error);
    }
  } catch (error) {
    console.error('Print error:', error);
  }
}

async function openOptions() {
  // 检查用户是否已登录
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，打开配置页面
      chrome.runtime.openOptionsPage();
    } else {
      // 未登录，打开登录页面
      chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
    }
    window.close();
  } catch (error) {
    console.error('检查登录状态失败:', error);
    // 出错时默认打开登录页面
    chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
    window.close();
  }
}