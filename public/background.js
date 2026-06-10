/**
 * Vue Printer Extension - Background Service Worker
 * 负责管理 WebSocket 连接、打印任务处理和 C-LODOP 集成
 */

const LODOP_SCRIPT_URL = 'http://127.0.0.1:8000/CLodopfuncs.js';
const LODOP_PORT = 8000;

// ============================================
// WebSocket 连接管理
// ============================================
const MAX_WS_LOGS = 100;

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
    this.logs = [];
  }

  /**
   * 添加一条日志（最多保留 MAX_WS_LOGS 条）
   */
  addLog(type, content) {
    const log = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleString(),
      timestamp: Date.now(),
      type,
      content
    };
    this.logs.push(log);
    if (this.logs.length > MAX_WS_LOGS) {
      this.logs.shift();
    }
    // 通知前端有新日志
    try {
      chrome.runtime.sendMessage({
        action: 'websocketLogAdded',
        log
      }).catch(() => {});
    } catch (e) {}
  }

  /**
   * 获取当前所有日志
   */
  getLogs() {
    return this.logs;
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
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
        
        // 移除末尾的斜杠，使用根路径连接（与 HTTP 共用路径）
        wsUrl = wsUrl.replace(/\/$/, '');
        
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
      this.addLog('info', '连接已存在，跳过');
      return;
    }

    this.connectionState = 'connecting';
    this.isManualClose = false;

    try {
      const wsUrl = await this.getWebSocketUrl();
      const authInfo = await this.getAuthInfo();

      if (!authInfo.isAuthenticated) {
        this.addLog('warning', '用户未登录，跳过连接');
        this.connectionState = 'disconnected';
        return;
      }

      this.addLog('info', `连接到: ${wsUrl}`);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.addLog('success', '连接已建立');
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
        this.addLog('error', `连接关闭 (code: ${event.code}, reason: ${event.reason || '无'})`);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.broadcastState();
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        this.addLog('error', `连接错误: ${error?.message || error}`);
        this.connectionState = 'disconnected';
        this.broadcastState();
      };

    } catch (error) {
      this.addLog('error', `连接失败: ${error?.message || error}`);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.addLog('info', '主动断开连接');
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
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(str);
      // 心跳消息不打日志，避免刷屏
      if (typeof data === 'object' && data.route !== 'ping' && data.route !== 'pong') {
        this.addLog('send', typeof data === 'object' ? JSON.stringify(data) : data);
      }
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
      // 心跳消息不打日志
      if (message.route === 'ping') {
        this.send({ route: 'pong' });
      } else {
        this.addLog('recv', JSON.stringify(message));

        if (message.route === 'print_task') {
          this.handlePrintTask(message);
        }

        // 广播给所有监听者
        chrome.runtime.sendMessage({
          action: 'websocketMessage',
          data: message
        }).catch(() => {});
      }

    } catch (error) {
      this.addLog('error', `消息解析错误: ${error?.message || error}`);
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
      this.addLog('warning', '达到最大重连次数，停止自动重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000);
    this.addLog('info', `${delay / 1000}s后重连(${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /**
   * 广播状态
   */
  broadcastState() {
    updateExtensionBadge(this.connectionState);
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
// 扩展图标角标管理
// ============================================
/**
 * 检查登录状态
 */
function checkLoggedIn(callback) {
  chrome.storage.local.get(['vue_printer_user_data'], (result) => {
    const userData = result.vue_printer_user_data;
    const isLoggedIn = !!(userData && Date.now() < userData.expiresAt);
    callback(isLoggedIn);
  });
}

/**
 * 更新浏览器工具栏中的扩展图标角标
 */
function updateExtensionBadge(wsState) {
  checkLoggedIn((isLoggedIn) => {
    let badgeText = '';
    let badgeColor = [117, 117, 117, 255]; // 灰色
    let titleText = 'Vue Printer';

    if (!isLoggedIn) {
      badgeText = '?';
      badgeColor = [117, 117, 117, 255]; // 灰色
      titleText = 'Vue Printer - 未登录';
    } else if (wsState === 'connected') {
      badgeText = '✓';
      badgeColor = [76, 175, 80, 255]; // 绿色 #4CAF50
      titleText = 'Vue Printer - 实时推送已连接';
    } else if (wsState === 'connecting') {
      badgeText = '◌';
      badgeColor = [255, 152, 0, 255]; // 橙色 #FF9800
      titleText = 'Vue Printer - 正在连接...';
    } else {
      badgeText = '✗';
      badgeColor = [244, 67, 54, 255]; // 红色 #f44336
      titleText = 'Vue Printer - 实时推送未连接';
    }

    try {
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: badgeColor });
      chrome.action.setTitle({ title: titleText });
    } catch (e) {
      console.error('[Badge] 更新角标失败:', e);
    }
  });
}

/**
 * 初始化扩展：设置默认存储、初始化角标、创建保活 alarm、尝试连接 WebSocket
 */
function initializeExtension() {
  // 初始化角标
  updateExtensionBadge(wsManager.connectionState);

  // 创建保活 alarm：每 1 分钟唤醒一次 service worker，避免被系统休眠
  chrome.alarms.create('keep-alive', { periodInMinutes: 1 });

  // 尝试连接 WebSocket（已登录用户）
  wsManager.connect();
}

// 扩展安装/更新时初始化
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
  initializeExtension();
  console.log('[BG] Vue Printer 已安装/更新');
});

// 浏览器启动时初始化
chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
  console.log('[BG] Vue Printer 已启动');
});

// 监听 alarm：定期检查 WebSocket 连接状态，必要时重连
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive') {
    // 如果已登录但 WebSocket 未连接，尝试重连
    checkLoggedIn((isLoggedIn) => {
      if (isLoggedIn && wsManager.connectionState !== 'connected') {
        console.log('[BG] 保活 alarm：检测到 WebSocket 未连接，尝试重连');
        wsManager.connect();
      } else {
        updateExtensionBadge(wsManager.connectionState);
      }
    });
  }
});

// 监听登录状态变化（用户登录/登出时更新角标并连接/断开 WebSocket）
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.vue_printer_user_data) {
    const newData = changes.vue_printer_user_data.newValue;
    if (newData && newData.token && Date.now() < newData.expiresAt) {
      console.log('[BG] 用户已登录，启动 WebSocket 并更新角标');
      wsManager.connect();
    } else {
      console.log('[BG] 用户未登录或已过期，断开 WebSocket 并更新角标');
      wsManager.disconnect();
    }
  }
});

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

  // WebSocket 日志查询
  if (request.action === 'wsGetLogs') {
    sendResponse({ success: true, logs: wsManager.getLogs() });
    return true;
  }

  if (request.action === 'wsClearLogs') {
    wsManager.clearLogs();
    sendResponse({ success: true });
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

  // 抖音电商 Cookie 获取
  if (request.action === 'getJinriCookies') {
    chrome.cookies.getAll({
      domain: '.jinritemai.com'
    }, (cookies) => {
      sendResponse({ success: true, cookies: cookies });
    });
    return true;
  }

  // 抖音电商 API 请求（使用已有 Cookie）
  if (request.action === 'jinriApiRequest') {
    const { url, method = 'GET', body = null } = request;
    
    // 获取抖音电商的 Cookie
    chrome.cookies.getAll({
      domain: '.jinritemai.com'
    }, async (cookies) => {
      if (!cookies || cookies.length === 0) {
        sendResponse({ success: false, error: '未找到抖音电商 Cookie，请先登录 jinritemai.com' });
        return;
      }

      // 将 Cookie 转换为请求头格式
      const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      try {
        const options = {
          method: method,
          headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://fxg.jinritemai.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
          },
          credentials: 'include'
        };

        if (body && method !== 'GET') {
          options.body = typeof body === 'string' ? body : JSON.stringify(body);
          options.headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(url, options);
        const data = await response.text();
        
        // 尝试解析为 JSON，如果失败则返回原始文本
        let parsedData = data;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // 不是 JSON，保持原样
        }

        sendResponse({ 
          success: true, 
          status: response.status,
          statusText: response.statusText,
          data: parsedData,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  // 检查抖音电商登录状态
  if (request.action === 'checkJinriLogin') {
    chrome.cookies.getAll({
      domain: '.jinritemai.com'
    }, (cookies) => {
      // 检查是否包含必要的登录 Cookie
      const cookieNames = cookies.map(c => c.name);
      const hasLoginCookie = cookieNames.some(name => 
        name.includes('sessionid') || 
        name.includes('sid') || 
        name.includes('token') ||
        name.includes('ssologin')
      );
      
      sendResponse({ 
        success: true, 
        isLoggedIn: hasLoginCookie && cookies.length > 0,
        cookieCount: cookies.length
      });
    });
    return true;
  }

  return false;
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