const LODOP_SCRIPT_URL = 'https://localhost:8443/CLodopfuncs.js';
const LODOP_PORT = 18000;

let lodopPluginInstalled = false;

async function checkLodopInstallation() {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);

    const checkInterval = setInterval(() => {
      try {
        if (iframe.contentWindow && iframe.contentWindow.getLodop) {
          clearInterval(checkInterval);
          document.body.removeChild(iframe);
          lodopPluginInstalled = true;
          resolve(true);
        }
      } catch (e) {
        clearInterval(checkInterval);
        document.body.removeChild(iframe);
        resolve(false);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      resolve(false);
    }, 5000);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkLodopStatus') {
    checkLodopInstallation().then(installed => {
      sendResponse({ installed, url: LODOP_SCRIPT_URL });
    });
    return true;
  }

  if (request.action === 'getPrintTemplates') {
    chrome.storage.local.get(['printTemplates'], (result) => {
      sendResponse({ templates: result.printTemplates || [] });
    });
    return true;
  }

  if (request.action === 'savePrintTemplate') {
    chrome.storage.local.get(['printTemplates'], (result) => {
      const templates = result.printTemplates || [];
      const templateIndex = templates.findIndex(t => t.id === request.template.id);

      if (templateIndex >= 0) {
        templates[templateIndex] = request.template;
      } else {
        templates.push(request.template);
      }

      chrome.storage.local.set({ printTemplates: templates }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'deletePrintTemplate') {
    chrome.storage.local.get(['printTemplates'], (result) => {
      const templates = result.printTemplates || [];
      const filteredTemplates = templates.filter(t => t.id !== request.templateId);

      chrome.storage.local.set({ printTemplates: filteredTemplates }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || {} });
    });
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set({ settings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'printDocument') {
    const printData = request.printData;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'executePrint',
          printData: printData
        }, (response) => {
          sendResponse(response);
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    printTemplates: [],
    settings: {
      defaultPrinter: '',
      paperSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    }
  });
  
  console.log('Vue Printer Extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  // 检查用户是否已登录
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;
    
    if (userData && Date.now() < userData.expiresAt) {
      // 已登录，打开配置页面
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    } else {
      // 未登录，打开登录页面
      chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
    }
  } catch (error) {
    console.error('检查登录状态失败:', error);
    // 出错时默认打开登录页面
    chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
  }
});

export { LODOP_SCRIPT_URL, LODOP_PORT };