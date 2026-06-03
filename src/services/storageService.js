class StorageService {
  constructor() {
    // 检测是否在浏览器扩展环境中
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      this.storage = chrome.storage.local;
      this.isChromeStorage = true;
    } else {
      // 普通网页环境使用 localStorage 模拟
      this.storage = {
        get: (keys) => {
          return new Promise((resolve) => {
            const result = {};
            if (typeof keys === 'string') {
              const value = localStorage.getItem(keys);
              result[keys] = value ? JSON.parse(value) : undefined;
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                const value = localStorage.getItem(key);
                result[key] = value ? JSON.parse(value) : undefined;
              });
            } else if (typeof keys === 'object') {
              Object.keys(keys).forEach(key => {
                const value = localStorage.getItem(key);
                result[key] = value ? JSON.parse(value) : keys[key];
              });
            }
            resolve(result);
          });
        },
        set: (items) => {
          return new Promise((resolve) => {
            Object.keys(items).forEach(key => {
              localStorage.setItem(key, JSON.stringify(items[key]));
            });
            resolve();
          });
        },
        remove: (keys) => {
          return new Promise((resolve) => {
            if (typeof keys === 'string') {
              localStorage.removeItem(keys);
            } else if (Array.isArray(keys)) {
              keys.forEach(key => localStorage.removeItem(key));
            }
            resolve();
          });
        }
      };
      this.isChromeStorage = false;
    }
    this.USER_DATA_KEY = 'vue_printer_user_data';
    this.ENCRYPTION_KEY = 'vue_printer_secure_key'; // 实际使用时应该从安全渠道获取
    this.TEMPLATES_KEY = 'vue_printer_templates';
  }

  /**
   * 加密数据
   * @param {string} data - 要加密的数据
   * @returns {string} 加密后的数据
   */
  encrypt(data) {
    try {
      // 使用简单的XOR加密，实际生产环境应该使用更安全的加密方式
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length));
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('加密失败:', error);
      return data;
    }
  }

  /**
   * 解密数据
   * @param {string} encryptedData - 要解密的数据
   * @returns {string} 解密后的数据
   */
  decrypt(encryptedData) {
    try {
      const decoded = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ this.ENCRYPTION_KEY.charCodeAt(i % this.ENCRYPTION_KEY.length));
      }
      return decrypted;
    } catch (error) {
      console.error('解密失败:', error);
      return encryptedData;
    }
  }

  /**
   * 保存用户数据
   * @param {object} userData - 用户数据对象
   * @returns {Promise} 保存结果
   */
  async saveUserData(userData) {
    try {
      const dataToSave = {
        ...userData,
        token: this.encrypt(userData.token),
        createdAt: Date.now(),
        expiresAt: userData.expiresAt ? new Date(userData.expiresAt).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000
      };

      await this.storage.set({
        [this.USER_DATA_KEY]: dataToSave
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('保存用户数据失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取用户数据
   * @returns {Promise} 用户数据对象
   */
  async getUserData() {
    try {
      const result = await this.storage.get(this.USER_DATA_KEY);
      const userData = result[this.USER_DATA_KEY];

      if (!userData) {
        return {
          success: false,
          message: '未找到用户数据'
        };
      }

      // 检查Token是否过期
      if (Date.now() > userData.expiresAt) {
        await this.clearUserData();
        return {
          success: false,
          message: 'Token已过期'
        };
      }

      // 解密Token
      const decryptedData = {
        ...userData,
        token: this.decrypt(userData.token)
      };

      return {
        success: true,
        data: decryptedData
      };
    } catch (error) {
      console.error('获取用户数据失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取Token
   * @returns {Promise} Token字符串
   */
  async getToken() {
    const result = await this.getUserData();
    if (result.success) {
      return {
        success: true,
        data: result.data.token
      };
    }
    return result;
  }

  /**
   * 检查用户是否已登录
   * @returns {Promise} 登录状态
   */
  async isLoggedIn() {
    const result = await this.getUserData();
    return result.success;
  }

  /**
   * 清除用户数据
   * @returns {Promise} 清除结果
   */
  async clearUserData() {
    try {
      await this.storage.remove(this.USER_DATA_KEY);
      return {
        success: true
      };
    } catch (error) {
      console.error('清除用户数据失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 更新Token
   * @param {string} newToken - 新的Token
   * @param {number} expiresAt - 过期时间
   * @returns {Promise} 更新结果
   */
  async updateToken(newToken, expiresAt) {
    const result = await this.getUserData();
    if (!result.success) {
      return result;
    }

    const updatedData = {
      ...result.data,
      token: this.encrypt(newToken),
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000
    };

    try {
      await this.storage.set({
        [this.USER_DATA_KEY]: updatedData
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('更新Token失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 保存设置
   * @param {object} settings - 设置对象
   * @returns {Promise} 保存结果
   */
  async saveSettings(settings) {
    try {
      await this.storage.set({ vue_printer_settings: settings });
      return {
        success: true
      };
    } catch (error) {
      console.error('保存设置失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取设置
   * @returns {Promise} 设置对象
   */
  async getSettings() {
    try {
      const result = await this.storage.get('vue_printer_settings');
      return {
        success: true,
        data: result.vue_printer_settings || {}
      };
    } catch (error) {
      console.error('获取设置失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 保存模板
   * @param {object} template - 模板对象
   * @returns {Promise} 保存结果
   */
  async saveTemplate(template) {
    try {
      const templates = await this.getTemplates();
      if (!templates.success) {
        return templates;
      }

      // 确保控件是数组
      let safeControls = template.controls || [];
      if (!Array.isArray(safeControls)) {
        safeControls = [];
      }

      const templateData = {
        ...template,
        controls: safeControls,
        id: template.id || Date.now().toString(),
        createdAt: template.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      console.log('保存模板数据:', templateData);

      const existingIndex = templates.data.findIndex(t => t.id === templateData.id);
      if (existingIndex >= 0) {
        templates.data[existingIndex] = templateData;
      } else {
        templates.data.push(templateData);
      }

      await this.storage.set({ [this.TEMPLATES_KEY]: templates.data });

      return {
        success: true,
        data: templateData
      };
    } catch (error) {
      console.error('保存模板失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取模板列表
   * @returns {Promise} 模板列表
   */
  async getTemplates() {
    try {
      const result = await this.storage.get(this.TEMPLATES_KEY);
      return {
        success: true,
        data: result[this.TEMPLATES_KEY] || []
      };
    } catch (error) {
      console.error('获取模板列表失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 获取单个模板
   * @param {string} id - 模板ID
   * @returns {Promise} 模板对象
   */
  async getTemplate(id) {
    try {
      const templates = await this.getTemplates();
      if (!templates.success) {
        return templates;
      }

      const template = templates.data.find(t => t.id === id);
      if (!template) {
        return {
          success: false,
          message: '模板不存在'
        };
      }

      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('获取模板失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 删除模板
   * @param {string} id - 模板ID
   * @returns {Promise} 删除结果
   */
  async deleteTemplate(id) {
    try {
      const templates = await this.getTemplates();
      if (!templates.success) {
        return templates;
      }

      const filtered = templates.data.filter(t => t.id !== id);
      await this.storage.set({ [this.TEMPLATES_KEY]: filtered });

      return {
        success: true
      };
    } catch (error) {
      console.error('删除模板失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// 创建单例
export const storageService = new StorageService();

export default storageService;