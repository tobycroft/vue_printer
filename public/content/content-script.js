let lodopInstance = null;

function loadLodopScript() {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('clodop-script');
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'clodop-script';
    script.src = 'http://127.0.0.1:8000/CLodopfuncs.js';
    script.type = 'text/javascript';
    script.onload = () => {
      if (window.getLodop) {
        lodopInstance = window.getLodop();
        resolve(true);
      } else {
        reject(new Error('C-LODOP not available'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load C-LODOP script'));
    document.head.appendChild(script);
  });
}

function generatePrintHTML(template, data) {
  let html = template.content;

  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(placeholder, data[key] || '');
  });

  return html;
}

function createPrintPanel() {
  const existingPanel = document.getElementById('vue-printer-panel');
  if (existingPanel) {
    existingPanel.remove();
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'vue-printer-panel';
  panel.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0,0,0,0.2);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      font-family: Arial, sans-serif;
    ">
      <div style="
        padding: 20px;
        background: #4CAF50;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h2 style="margin: 0; font-size: 18px;">Vue Printer</h2>
        <button id="close-panel" style="
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
        ">×</button>
      </div>
      <div id="panel-content" style="flex: 1; overflow-y: auto; padding: 20px;">
        <div style="color: #666; text-align: center; margin-top: 50px;">
          <p>Loading templates...</p>
        </div>
      </div>
      <div style="
        padding: 15px;
        border-top: 1px solid #ddd;
        background: #f5f5f5;
      ">
        <button id="print-now" style="
          width: 100%;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        ">Print Now</button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById('close-panel').addEventListener('click', () => {
    panel.remove();
  });

  chrome.runtime.sendMessage({ action: 'getPrintTemplates' }, (response) => {
    const contentDiv = document.getElementById('panel-content');
    if (response && response.templates && response.templates.length > 0) {
      contentDiv.innerHTML = response.templates.map(template => `
        <div style="
          margin-bottom: 15px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        " data-template-id="${template.id}">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${template.name}</h3>
          <p style="margin: 0; color: #666; font-size: 12px;">${template.description || 'No description'}</p>
        </div>
      `).join('');

      contentDiv.querySelectorAll('[data-template-id]').forEach(el => {
        el.addEventListener('click', () => {
          const templateId = el.getAttribute('data-template-id');
          selectTemplate(templateId);
        });
      });
    } else {
      contentDiv.innerHTML = `
        <div style="text-align: center; color: #999;">
          <p>No templates found</p>
          <p style="font-size: 12px;">Create templates in the options page</p>
        </div>
      `;
    }
  });
}

function selectTemplate(templateId) {
  chrome.runtime.sendMessage({ action: 'getPrintTemplates' }, (response) => {
    const template = response.templates.find(t => t.id === templateId);
    if (template) {
      currentTemplate = template;
      highlightSelectedTemplate(templateId);
    }
  });
}

function highlightSelectedTemplate(templateId) {
  document.querySelectorAll('[data-template-id]').forEach(el => {
    if (el.getAttribute('data-template-id') === templateId) {
      el.style.borderColor = '#4CAF50';
      el.style.backgroundColor = '#f0f8f0';
    } else {
      el.style.borderColor = '#ddd';
      el.style.backgroundColor = 'transparent';
    }
  });
}

let currentTemplate = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPrintPanel') {
    createPrintPanel();
    sendResponse({ success: true });
  }

  if (message.action === 'executePrint' && message.printData) {
    executePrint(message.printData)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function executePrint(printData) {
  try {
    await loadLodopScript();

    const LODOP = window.getLodop();

    LODOP.PRINT_INIT(printData.taskName || 'Vue Printer Task');
    LODOP.SET_PRINTER_INDEXA(printData.printerName || '');
    LODOP.SET_PRINT_PAGESIZE(
      printData.orientation === 'landscape' ? 1 : 0,
      printData.paperWidth || 210,
      printData.paperHeight || 297,
      ''
    );

    if (printData.htmlContent) {
      LODOP.ADD_PRINT_HTM(
        printData.marginTop || 20,
        printData.marginLeft || 20,
        printData.pageWidth || '100mm',
        printData.pageHeight || '200mm',
        printData.htmlContent
      );
    } else if (printData.textContent) {
      LODOP.ADD_PRINT_TEXT(
        printData.marginTop || 20,
        printData.marginLeft || 20,
        printData.pageWidth || '100mm',
        printData.pageHeight || '200mm',
        printData.textContent
      );
    }

    LODOP.PREVIEW();
    return { success: true };
  } catch (error) {
    console.error('Print execution failed:', error);
    return { success: false, error: error.message };
  }
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    createPrintPanel();
  }
});