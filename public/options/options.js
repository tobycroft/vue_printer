let templates = [];
let editingTemplateId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  loadSettings();
  checkLodopConnection();
  setupEventListeners();
});

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
          <p>No templates yet</p>
          <small>Create your first template to get started</small>
        </div>
      `;
      return;
    }

    container.innerHTML = templates.map(template => `
      <div class="template-card" data-id="${template.id}">
        <h3>${template.name}</h3>
        <p>${template.description || 'No description'}</p>
        <div class="template-actions">
          <button class="btn-edit" data-action="edit" data-id="${template.id}">Edit</button>
          <button class="btn-delete" data-action="delete" data-id="${template.id}">Delete</button>
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
        <p>Failed to load templates</p>
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
    showToast('Settings saved', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

async function checkLodopConnection() {
  const statusEl = document.getElementById('connection-status');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLodopStatus' });

    if (response && response.installed) {
      statusEl.innerHTML = '<span style="color: #4CAF50;">✓ Connected</span> - C-LODOP is ready';
      statusEl.style.background = '#e8f5e9';
    } else {
      statusEl.innerHTML = '<span style="color: #f44336;">✗ Not Connected</span> - Please install C-LODOP';
      statusEl.style.background = '#ffebee';
    }
  } catch (error) {
    statusEl.innerHTML = '<span style="color: #ff9800;">⚠ Error</span> - Could not check status';
    statusEl.style.background = '#fff3e0';
  }
}

function openCreateModal() {
  editingTemplateId = null;
  document.getElementById('modal-title').textContent = 'Create Template';
  document.getElementById('template-name').value = '';
  document.getElementById('template-description').value = '';
  document.getElementById('template-content').value = '';
  document.getElementById('template-modal').classList.add('active');
}

function openEditModal(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;

  editingTemplateId = templateId;
  document.getElementById('modal-title').textContent = 'Edit Template';
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
    showToast('Template name is required', 'error');
    return;
  }

  if (!content) {
    showToast('Template content is required', 'error');
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

    showToast(editingTemplateId ? 'Template updated' : 'Template created', 'success');
    closeModal();
    loadTemplates();
  } catch (error) {
    console.error('Failed to save template:', error);
    showToast('Failed to save template', 'error');
  }
}

async function deleteTemplate(templateId) {
  if (!confirm('Are you sure you want to delete this template?')) {
    return;
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'deletePrintTemplate',
      templateId
    });

    showToast('Template deleted', 'success');
    loadTemplates();
  } catch (error) {
    console.error('Failed to delete template:', error);
    showToast('Failed to delete template', 'error');
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