let templates = [];
let editingTemplateId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  loadSettings();
  checkLodopConnection();
  setupEventListeners();
  setupNavigation();
});

// 设置导航菜单
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除所有激活状态
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
      
      // 激活当前项
      item.classList.add('active');
      const sectionId = item.getAttribute('data-section');
      document.getElementById(`section-${sectionId}`).classList.add('active');
    });
  });
}

function setupEventListeners() {
  document.getElementById('btn-create-template').addEventListener('click', openCreateModal);
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveTemplate);

  document.getElementById('template-modal').addEventListener('click', (e) => {
    if (e.target.id === 'template-modal') {
      closeModal();
    }
  });

  document.getElementById('default-printer').addEventListener('change', saveSettings);
  document.getElementById('paper-size').addEventListener('change', saveSettings);
  document.getElementById('orientation').addEventListener('change', saveSettings);
  document.getElementById('copies').addEventListener('change', saveSettings);
}

async function loadTemplates() {
  const container = document.getElementById('template-container');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPrintTemplates' });
    templates = response.templates || [];

    if (templates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>暂无模板</p>
          <p style="font-size: 13px; margin-top: 5px;">点击"创建新模板"开始使用</p>
        </div>
      `;
      return;
    }

    container.innerHTML = templates.map(template => `
      <div class="template-card" data-id="${template.id}">
        <h3>${template.name}</h3>
        <p>${template.description || '暂无描述'}</p>
        <div class="template-actions">
          <button class="btn-edit" data-action="edit" data-id="${template.id}">编辑</button>
          <button class="btn-delete" data-action="delete" data-id="${template.id}">删除</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
    });

    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => deleteTemplate(btn.getAttribute('data-id')));
    });
  } catch (error) {
    console.error('Failed to load templates:', error);
    container.innerHTML = `
      <div class="empty-state">
        <p>加载模板失败</p>
      </div>
    `;
  }
}

async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const settings = response.settings || {};

    document.getElementById('default-printer').value = settings.defaultPrinter || '';
    document.getElementById('paper-size').value = settings.paperSize || 'A4';
    document.getElementById('orientation').value = settings.orientation || 'portrait';
    document.getElementById('copies').value = settings.copies || 1;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function saveSettings() {
  const settings = {
    defaultPrinter: document.getElementById('default-printer').value,
    paperSize: document.getElementById('paper-size').value,
    orientation: document.getElementById('orientation').value,
    copies: parseInt(document.getElementById('copies').value)
  };

  try {
    await chrome.runtime.sendMessage({ action: 'saveSettings', settings });
    showToast('设置已保存', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('保存设置失败', 'error');
  }
}

async function checkLodopConnection() {
  const statusEl = document.getElementById('connection-status');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLodopStatus' });

    if (response && response.installed) {
      statusEl.innerHTML = '<span style="color: #4CAF50; font-weight: 600;">✓ 已连接</span> - C-LODOP 服务就绪';
      statusEl.style.background = '#252525';
      statusEl.style.borderColor = '#4CAF50';
    } else {
      statusEl.innerHTML = '<span style="color: #f44336; font-weight: 600;">✗ 未连接</span> - 请安装 C-LODOP';
      statusEl.style.background = '#252525';
      statusEl.style.borderColor = '#f44336';
    }
  } catch (error) {
    statusEl.innerHTML = '<span style="color: #ff9800; font-weight: 600;">⚠ 错误</span> - 无法检查状态';
    statusEl.style.background = '#252525';
    statusEl.style.borderColor = '#ff9800';
  }
}

function openCreateModal() {
  editingTemplateId = null;
  document.getElementById('modal-title').textContent = '创建模板';
  document.getElementById('template-name').value = '';
  document.getElementById('template-description').value = '';
  document.getElementById('template-content').value = '';
  document.getElementById('template-modal').classList.add('active');
}

function openEditModal(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  editingTemplateId = templateId;
  document.getElementById('modal-title').textContent = '编辑模板';
  document.getElementById('template-name').value = template.name;
  document.getElementById('template-description').value = template.description || '';
  document.getElementById('template-content').value = template.content || '';
  document.getElementById('template-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('template-modal').classList.remove('active');
  editingTemplateId = null;
}

async function saveTemplate() {
  const name = document.getElementById('template-name').value.trim();
  const description = document.getElementById('template-description').value.trim();
  const content = document.getElementById('template-content').value.trim();

  if (!name) {
    showToast('模板名称不能为空', 'error');
    return;
  }

  if (!content) {
    showToast('模板内容不能为空', 'error');
    return;
  }

  const template = {
    id: editingTemplateId || `template_${Date.now()}`,
    name,
    description,
    content,
    updatedAt: new Date().toISOString()
  };

  try {
    await chrome.runtime.sendMessage({
      action: 'savePrintTemplate',
      template
    });

    showToast(editingTemplateId ? '模板已更新' : '模板已创建', 'success');
    closeModal();
    loadTemplates();
  } catch (error) {
    console.error('Failed to save template:', error);
    showToast('保存模板失败', 'error');
  }
}

async function deleteTemplate(templateId) {
  if (!confirm('确定要删除此模板吗？')) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'deletePrintTemplate',
      templateId
    });

    showToast('模板已删除', 'success');
    loadTemplates();
  } catch (error) {
    console.error('Failed to delete template:', error);
    showToast('删除模板失败', 'error');
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}