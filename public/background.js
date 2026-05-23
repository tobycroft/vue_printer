const LODOP_SCRIPT_URL = 'https://localhost:8443/CLodopfuncs.js';
const LODOP_PORT = 18000;
const WS_SERVER_URL = 'wss://your-server-url'; // 请替换为实际的WebSocket服务器地址

let lodopPluginInstalled = false;
let socket = null;
let reconnectTimer = null;
const RECONNECT_INTERVAL = 5000; // 5秒重连间隔

function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  socket = new WebSocket(WS_SERVER_URL);

  socket.onopen = () => {
    console.log('WebSocket连接已建立');
    clearTimeout(reconnectTimer);
    
    // 发送心跳包保持连接
    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000); // 30秒心跳
  };

  socket.onmessage = (event) => {
    console.log('收到WebSocket消息:', event.data);
    try {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    } catch (e) {
      console.error('解析WebSocket消息失败:', e);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket连接关闭，代码:', event.code, '原因:', event.reason);
    if (event.code !== 1000) { // 非正常关闭，自动重连
      reconnectTimer = setTimeout(connectWebSocket, RECONNECT_INTERVAL);
    }
  };
}

function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'print_job':
      // 处理打印任务
      console.log('收到打印任务:', message.data);
      break;
    case 'config_update':
      // 处理配置更新
      chrome.storage.local.set({ printerConfig: message.data });
      break;
    default:
      console.log('未知消息类型:', message.type);
  }
}

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

  // 启动WebSocket连接
  connectWebSocket();
  
  console.log('Vue Printer Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  // 在新标签页打开配置页面
  chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
});

export { LODOP_SCRIPT_URL, LODOP_PORT };