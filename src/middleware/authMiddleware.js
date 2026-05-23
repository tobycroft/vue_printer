import { storageService } from '../services/storageService';

class AuthMiddleware {
  constructor() {
    this.publicPaths = ['/login.html', '/register.html'];
  }

  /**
   * 检查用户是否已登录
   * @returns {Promise} 登录状态
   */
  async checkAuth() {
    const result = await storageService.isLoggedIn();
    return result;
  }

  /**
   * 验证访问权限
   * @param {string} currentPath - 当前页面路径
   * @returns {Promise} 验证结果
   */
  async validateAccess(currentPath) {
    // 检查是否是公开路径
    if (this.publicPaths.some(path => currentPath.includes(path))) {
      return {
        allowed: true,
        redirect: null
      };
    }

    // 检查登录状态
    const isLoggedIn = await this.checkAuth();
    
    if (!isLoggedIn) {
      return {
        allowed: false,
        redirect: '/login.html'
      };
    }

    return {
      allowed: true,
      redirect: null
    };
  }

  /**
   * 应用中间件
   * @param {string} currentPath - 当前页面路径
   * @returns {Promise} 是否需要重定向
   */
  async apply(currentPath) {
    const result = await this.validateAccess(currentPath);
    
    if (!result.allowed && result.redirect) {
      window.location.href = result.redirect;
      return false;
    }
    
    return true;
  }

  /**
   * 获取当前用户信息
   * @returns {Promise} 用户信息
   */
  async getUserInfo() {
    const result = await storageService.getUserData();
    if (result.success) {
      return result.data;
    }
    return null;
  }

  /**
   * 获取请求头中的Authorization
   * @returns {Promise} Authorization头
   */
  async getAuthHeader() {
    const result = await storageService.getToken();
    if (result.success) {
      return {
        'Authorization': `Bearer ${result.data}`
      };
    }
    return {};
  }

  /**
   * 登出
   * @returns {Promise} 登出结果
   */
  async logout() {
    const result = await storageService.clearUserData();
    if (result.success) {
      window.location.href = '/login.html';
    }
    return result;
  }
}

export const authMiddleware = new AuthMiddleware();