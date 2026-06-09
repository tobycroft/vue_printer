/**
 * WebSocket 连接管理服务
 * 负责与后端服务器保持长连接，处理打印任务推送
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.isManualClose = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.heartbeatInterval = 30000;
    this.connectionState = 'disconnected'; // disconnected, connecting, connected
    this.messageHandlers = new Map();
    this.apiBaseUrl = '';
  }

  /**
   * 获取 WebSocket URL
   * 将 HTTP URL 转换为 WS URL
   */
  async getWebSocketUrl() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['api_base_url'], (result) => {
        let baseUrl = result.api_base_url || 'https://printapi.tuuz.ltd:444';
        
        // 转换为 WebSocket URL
        let wsUrl = baseUrl
          .replace(/^http/, 'ws')
          .replace(/^https/, 'wss');
        
        // 确保 URL 以 /ws 结尾或包含正确的路径
        if (!wsUrl.includes('/ws')) {
          wsUrl = wsUrl + '/ws';
        }
        
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
        if (userData && userData.token) {
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
   * 建立 WebSocket 连接
   */
  async connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WebSocket] 连接已存在，跳过');
      return;
    }

    this.connectionState = 'connecting';
    this.isManualClose = false;

    try {
      const wsUrl = await this.getWebSocketUrl();
      const authInfo = await this.getAuthInfo();

      if (!authInfo.isAuthenticated) {
        console.log('[WebSocket] 用户未登录，跳过连接');
        this.connectionState = 'disconnected';
        return;
      }

      console.log(`[WebSocket] 正在连接到: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接已建立');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        
        // 发送登录认证消息
        this.send({
          route: 'login',
          uid: authInfo.uid,
          token: authInfo.token
        });

        // 启动心跳
        this.startHeartbeat();
        
        // 广播连接状态
        this.broadcastState();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log(`[WebSocket] 连接已关闭 (code: ${event.code})`);
        this.connectionState = 'disconnected';
        this.stopHeartbeat();
        this.broadcastState();

        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
        this.connectionState = 'disconnected';
        this.broadcastState();
      };

    } catch (error) {
      console.error('[WebSocket] 连接失败:', error);
      this.connectionState = 'disconnected';
      this.scheduleReconnect();
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    console.log('[WebSocket] 手动断开连接');
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
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    }
    console.warn('[WebSocket] 连接未建立，无法发送消息');
    return false;
  }

  /**
   * 处理收到的消息
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('[WebSocket] 收到消息:', message);

      // 根据消息类型分发处理
      if (message.route) {
        switch (message.route) {
          case 'print_task':
            this.handlePrintTask(message);
            break;
          case 'ping':
            // 心跳响应
            this.send({ route: 'pong' });
            break;
          case 'pong':
            // 服务器心跳响应
            break;
          default:
            // 触发注册的消息处理器
            const handler = this.messageHandlers.get(message.route);
            if (handler) {
              handler(message);
            }
        }
      }

      // 广播消息给所有监听者
      chrome.runtime.sendMessage({
        action: 'websocketMessage',
        data: message
      }).catch(() => {
        // 可能没有监听者，忽略错误
      });

    } catch (error) {
      console.error('[WebSocket] 消息解析错误:', error);
    }
  }

  /**
   * 处理打印任务
   */
  async handlePrintTask(message) {
    console.log('[WebSocket] 收到打印任务:', message);
    
    // 存储打印任务
    const taskId = message.task_id || Date.now();
    const taskData = {
      id: taskId,
      ...message.data,
      receivedAt: Date.now(),
      status: 'pending'
    };

    // 保存到存储
    chrome.storage.local.get(['pendingPrintTasks'], (result) => {
      const tasks = result.pendingPrintTasks || [];
      tasks.push(taskData);
      chrome.storage.local.set({ pendingPrintTasks: tasks });
    });

    // 通知前台页面
    chrome.runtime.sendMessage({
      action: 'newPrintTask',
      data: taskData
    }).catch(() => {});

    // 尝试立即打印
    this.executePrint(taskData);
  }

  /**
   * 执行打印
   */
  async executePrint(taskData) {
    try {
      // 获取当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'executePrint',
          printData: taskData
        });
      }
    } catch (error) {
      console.error('[WebSocket] 执行打印失败:', error);
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
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 60000);
    
    console.log(`[WebSocket] ${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 广播连接状态
   */
  broadcastState() {
    chrome.runtime.sendMessage({
      action: 'websocketStateChange',
      state: this.connectionState
    }).catch(() => {});
  }

  /**
   * 注册消息处理器
   */
  onMessage(route, handler) {
    this.messageHandlers.set(route, handler);
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// 创建单例
const websocketService = new WebSocketService();

export default websocketService;