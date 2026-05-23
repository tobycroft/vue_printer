let selectedTemplate = null;

document.addEventListener('DOMContentLoaded', () => {
  checkLodopStatus();
  loadTemplates();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('print-current').addEventListener('click', printCurrentPage);
  document.getElementById('btn-options').addEventListener('click', openOptions);
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadTemplates();
    checkLodopStatus();
  });
  document.getElementById('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    openOptions();
  });
}

async function checkLodopStatus() {
  const indicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');

  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkLodopStatus' });

    if (response && response.installed) {
      indicator.classList.remove('disconnected');
      indicator.classList.add('connected');
      statusText.textContent = 'C-LODOP Connected';
    } else {
      indicator.classList.remove('connected');
      indicator.classList.add('disconnected');
      statusText.textContent = 'C-LODOP Not Found';
    }
  } catch (error) {
    console.error('Failed to check LODOP status:', error);
    indicator.classList.remove('connected');
    indicator.classList.add('disconnected');
    statusText.textContent = 'Connection Error';
  }
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

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options/options.html'));
  }
}