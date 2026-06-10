/**
 * 抖音电商 API 服务
 * 通过 Background Service Worker 使用浏览器已登录的 Cookie 访问抖音电商 API
 */

class JinriApiService {
  constructor() {
    this.baseUrl = 'https://fxg.jinritemai.com';
  }

  /**
   * 检查是否已登录抖音电商
   */
  async checkLogin() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkJinriLogin' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * 获取抖音电商 Cookie
   */
  async getCookies() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getJinriCookies' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * 发送 API 请求（使用浏览器已有 Cookie）
   * @param {string} url - 完整的 API URL
   * @param {string} method - HTTP 方法，默认 GET
   * @param {object} body - 请求体（POST/PUT 时使用）
   */
  async request(url, method = 'GET', body = null) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'jinriApiRequest',
        url: url,
        method: method,
        body: body
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response);
      });
    });
  }

  /**
   * 获取订单列表
   * @param {object} params - 查询参数
   */
  async getOrderList(params = {}) {
    const defaultParams = {
      page: 0,
      pageSize: 10,
      order_by: 'create_time',
      order: 'desc',
      tab: 'all',
      appid: 1,
      _bid: 'ffa_order',
      aid: 4272
    };

    const mergedParams = { ...defaultParams, ...params };
    const queryString = new URLSearchParams(mergedParams).toString();
    const url = `${this.baseUrl}/api/order/searchlist?${queryString}`;

    return this.request(url, 'GET');
  }

  /**
   * 获取订单详情
   * @param {string} orderId - 订单 ID
   */
  async getOrderDetail(orderId) {
    const url = `${this.baseUrl}/api/order/detail?order_id=${orderId}`;
    return this.request(url, 'GET');
  }

  /**
   * 获取商品列表
   * @param {object} params - 查询参数
   */
  async getProductList(params = {}) {
    const defaultParams = {
      page: 0,
      pageSize: 10
    };

    const mergedParams = { ...defaultParams, ...params };
    const queryString = new URLSearchParams(mergedParams).toString();
    const url = `${this.baseUrl}/api/product/list?${queryString}`;

    return this.request(url, 'GET');
  }
}

// 创建单例实例
const jinriApiService = new JinriApiService();

export default jinriApiService;
export { JinriApiService };