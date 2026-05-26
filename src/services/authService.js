const API_BASE_URL = 'https://printapi.tuuz.ltd:444'; // API地址

class AuthService {
  constructor() {
    this.apiBaseUrl = API_BASE_URL;
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} captcha - 验证码
   * @returns {Promise} 登录结果
   */
  async login(username, password, captcha) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          captcha
        })
      });

      return {
        success: true,
        data: {
          uid: response.uid,
          token: response.token,
          expiresAt: response.expiresAt
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 用户注册
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} captcha - 验证码
   * @returns {Promise} 注册结果
   */
  async register(username, password, captcha) {
    try {
      const response = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          captcha
        })
      });

      return {
        success: true,
        data: {
          uid: response.uid,
          token: response.token,
          expiresAt: response.expiresAt
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取用户信息
   * @param {string} token - 用户Token
   * @returns {Promise} 用户信息
   */
  async getUserInfo(token) {
    try {
      const response = await this.request('/auth/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 刷新Token
   * @param {string} refreshToken - 刷新Token
   * @returns {Promise} 新的Token信息
   */
  async refreshToken(refreshToken) {
    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken
        })
      });

      return {
        success: true,
        data: {
          token: response.token,
          expiresAt: response.expiresAt
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 用户登出
   * @param {string} token - 用户Token
   * @returns {Promise} 登出结果
   */
  async logout(token) {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export const authService = new AuthService();