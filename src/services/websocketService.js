/**
 * WebSocket 前端服务
 * 封装与 Background Service Worker 的通信，提供 Vue 组件友好的 API
 */

class WebSocketService {
  constructor() {
    this.state = 'disconnected';
    this.reconnectAttempts = 0;
    this.listeners = new Map();
    this.messageQueue = [];
    this._setupMessageListener();
  }

  /**
   * 设置消息监听
   */
  _setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'websocketStateChange') {
        this.state = message.state;
        this._emit('stateChange', message.state);
      }
      
      if (message.action === 'websocketMessage') {
        this._emit('message', message.data);
      }
      
      if (message.action === 'newPrintTask') {
        this._emit('printTask', message.data);
      }
      
      return false;
    });
  }

  /**
   * 连接 WebSocket
   */
  async connect() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'wsConnect' }, (response) => {
        if (response) {
          this.state = response.state?.state || 'connecting';
          this.reconnectAttempts = response.state?.reconnectAttempts || 0;
        }
        resolve(response);
      });
    });
  }

  /**
   * 断开连接
   */
  async disconnect() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'wsDisconnect' }, (response) => {
        this.state = 'disconnected';
        resolve(response);
      });
    });
  }

  /**
   * 获取当前状态
   */
  async getState() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'wsGetState' }, (response) => {
        if (response) {
          this.state = response.state;
          this.reconnectAttempts = response.reconnectAttempts;
        }
        resolve(response);
      });
    });
  }

  /**
   * 发送消息
   */
  async send(data) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'wsSend', 
        data: data 
      }, (response) => {
        resolve(response?.success || false);
      });
    });
  }

  /**
   * 事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * 触发事件
   */
  _emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocketService] 事件处理错误:`, error);
        }
      });
    }
  }

  /**
   * 获取连接状态文本
   */
  getStateText() {
    const stateMap = {
      'connected': '已连接',
      'connecting': '连接中...',
      'disconnected': '未连接'
    };
    return stateMap[this.state] || this.state;
  }

  /**
   * 是否已连接
   */
  isConnected() {
    return this.state === 'connected';
  }
}

// 创建单例
const websocketService = new WebSocketService();

export default websocketService;