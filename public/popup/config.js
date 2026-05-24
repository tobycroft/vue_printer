// API配置文件
const CONFIG = {
  // 默认API地址
  API_BASE_URL: 'http://127.0.0.1',
  
  // API版本
  API_VERSION: 'v1',
  
  // 超时设置
  TIMEOUT: 10000,
  
  // 验证码接口
  CAPTCHA_URL: '/captcha',
  
  // 认证接口
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout'
  },
  
  // 其他接口
  TEMPLATES: {
    LIST: '/templates',
    CREATE: '/templates',
    UPDATE: '/templates/{id}',
    DELETE: '/templates/{id}'
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}