/**
 * Vue Printer Extension - Background Service Worker
 * 负责管理 WebSocket 连接、打印任务处理和 C-LODOP 集成
 */

const LODOP_SCRIPT_URL = 'http://127.0.0.1:8000/CLodopfuncs.js';
const LODOP_PORT = 8000;

// ============================================
// WebSocket 连接管理
// ============================================
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.isManualClose = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.heartbeatInterval = 30000;
    this.connectionState = 'disconnected';
    this.messageHandlers = new Map();
  }

  /**
   * 获取 WebSocket URL
   */
  async getWebSocketUrl() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['api_base_url'], (result) => {
        let baseUrl = result.api_base_url || 'https://printapi.tuuz.ltd:444';
        
        // 将 HTTP/HTTPS 转换为 WS/WSS
        let wsUrl = baseUrl
          .replace(/^http:/, 'ws:')
          .replace(/^https:/, 'wss:');
        
        // 确保 URL 以 /ws 结尾
        if (!wsUrl.endsWith('/ws')) {
          wsUrl = wsUrl.replace(/\/$/, '') + '/ws';
        }
        
        console.log('[WS] 连接 URL:', wsUrl);
        resolve(wsUrl);
      });
    });
  }

  /**
   * 获取认证信息
   */
  async getAuthInfo() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['vue_printer_user_data'], (result) => {
        const userData = result.vue_printer_user_data;
        if (userData && userData.token && Date.now() < userData.expiresAt) {
          resolve({
            uid: userData.uid,
            token: userData.token,
            isAuthenticated: true
          });
        } else {
          resolve({ isAuthenticated: false });
        }
      });
    });
  }

  /**
   * 建立连接
   */
  async connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WS] 连接已存在');
      return;
    }

    this.connectionState = 'connecting';
    this.isManualClose = false;

    try {
      const wsUrl = await this.getWebSocketUrl();
      const authInfo = await this.getAuthInfo();

      if (!authInfo.isAuthenticated) {
        console.log('[WS] 用户未登录，跳过连接');
        this.connectionState = 'disconnected';
        return;
      }

      console.log(`[WS] 连接到: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] 连接已建立');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;

        // 发送认证
        this.send({
          route: 'login',
          uid: authInfo.uid,
          token: authInfo.token
        });

        this.startHeartbeat();
        this.broadcastState();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] 连接关闭 (code: ${event.code})`);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.broadcastState();
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] 错误:', error);
        this.connectionState = 'disconnected';
        this.broadcastState();
      };

    } catch (error) {
      console.error('[WS] 连接失败:', error);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.broadcastState();
  }

  /**
   * 发送消息
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  /**
   * 处理消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('[WS] 收到:', message);

      if (message.route === 'print_task') {
        this.handlePrintTask(message);
      } else if (message.route === 'ping') {
        this.send({ route: 'pong' });
      }

      // 广播给所有监听者
      chrome.runtime.sendMessage({
        action: 'websocketMessage',
        data: message
      }).catch(() => {});

    } catch (error) {
      console.error('[WS] 消息解析错误:', error);
    }
  }

  /**
   * 处理打印任务
   */
  async handlePrintTask(message) {
    console.log('[WS] 打印任务:', message);

    const taskData = {
      id: message.task_id || Date.now(),
      ...message.data,
      receivedAt: Date.now(),
      status: 'pending'
    };

    // 保存任务
    chrome.storage.local.get(['pendingPrintTasks'], (result) => {
      const tasks = result.pendingPrintTasks || [];
      tasks.push(taskData);
      chrome.storage.local.set({ pendingPrintTasks: tasks });
    });

    // 通知前台
    chrome.runtime.sendMessage({
      action: 'newPrintTask',
      data: taskData
    }).catch(() => {});

    // 执行打印
    this.executePrint(taskData);
  }

  /**
   * 执行打印
   */
  async executePrint(taskData) {
    try {
      // 查找有内容脚本的标签页
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'executePrint',
            printData: taskData
          });
          return; // 成功发送给一个标签页即可
        } catch (e) {
          // 该标签页可能没有内容脚本，继续尝试下一个
        }
      }
    } catch (error) {
      console.error('[WS] 打印失败:', error);
    }
  }

  /**
   * 启动心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ route: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] 达到最大重连次数');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000);
    console.log(`[WS] ${delay / 1000}s后重连(${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /**
   * 广播状态
   */
  broadcastState() {
    chrome.runtime.sendMessage({
      action: 'websocketStateChange',
      state: this.connectionState
    }).catch(() => {});
  }

  getState() {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建 WebSocket 管理器实例
const wsManager = new WebSocketManager();

// ============================================
// C-LODOP 检测
// ============================================
async function checkLodopInstallation() {
  return new Promise((resolve) => {
    fetch('http://127.0.0.1:8000/CLodopfuncs.js', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    .then(() => resolve(true))
    .catch(() => resolve(false));
  });
}

// ============================================
// 消息处理
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // WebSocket 控制
  if (request.action === 'wsConnect') {
    wsManager.connect().then(() => {
      sendResponse({ success: true, state: wsManager.getState() });
    });
    return true;
  }

  if (request.action === 'wsDisconnect') {
    wsManager.disconnect();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'wsGetState') {
    sendResponse(wsManager.getState());
    return true;
  }

  if (request.action === 'wsSend') {
    const sent = wsManager.send(request.data);
    sendResponse({ success: sent });
    return true;
  }

  // C-LODOP 检测
  if (request.action === 'checkLodopStatus') {
    checkLodopInstallation().then(installed => {
      sendResponse({ installed, url: LODOP_SCRIPT_URL });
    });
    return true;
  }

  // 打印模板管理
  if (request.action === 'getPrintTemplates') {
    chrome.storage.local.get(['printTemplates'], (result) => {
      sendResponse({ templates: result.printTemplates || [] });
    });
    return true;
  }

  if (request.action === 'savePrintTemplate') {
    chrome.storage.local.get(['printTemplates'], (result) => {
      const templates = result.printTemplates || [];
      const index = templates.findIndex(t => t.id === request.template.id);
      if (index >= 0) {
        templates[index] = request.template;
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
      const templates = (result.printTemplates || []).filter(t => t.id !== request.templateId);
      chrome.storage.local.set({ printTemplates: templates }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  // 设置管理
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

  // 打印文档
  if (request.action === 'printDocument') {
    chrome.tabs.query({}, (tabs) => {
      let sent = false;
      for (const tab of tabs) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'executePrint',
            printData: request.printData
          }, (response) => {
            if (!sent && response) {
              sent = true;
              sendResponse(response);
            }
          });
        } catch (e) {}
      }
      // 如果没有标签页响应，稍后返回错误
      setTimeout(() => {
        if (!sent) {
          sendResponse({ success: false, error: 'No active print handler found' });
        }
      }, 1000);
    });
    return true;
  }

  return false;
});

// ============================================
// 生命周期事件
// ============================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    printTemplates: [],
    pendingPrintTasks: [],
    settings: {
      defaultPrinter: '',
      paperSize: 'A4',
      orientation: 'portrait',
      margin: { top: 20, right: 20, bottom: 20, left: 20 }
    }
  });
  console.log('Vue Printer Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Vue Printer Extension started');
  // 浏览器启动时尝试连接 WebSocket
  wsManager.connect();
});

// 监听存储变化，当用户登录时自动连接
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.vue_printer_user_data) {
    const newData = changes.vue_printer_user_data.newValue;
    if (newData && newData.token && Date.now() < newData.expiresAt) {
      console.log('[Background] 用户已登录，启动 WebSocket');
      wsManager.connect();
    } else {
      console.log('[Background] 用户未登录或已过期，断开 WebSocket');
      wsManager.disconnect();
    }
  }
});

// 点击扩展图标
chrome.action.onClicked.addListener(async (tab) => {
  try {
    const result = await chrome.storage.local.get('vue_printer_user_data');
    const userData = result.vue_printer_user_data;

    if (userData && Date.now() < userData.expiresAt) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
    }
  } catch (error) {
    chrome.tabs.create({ url: chrome.runtime.getURL('login.html') });
  }
});

export { LODOP_SCRIPT_URL, LODOP_PORT, wsManager };