// API配置文件 - 匹配go_printer后端接口
const CONFIG = {
  // 默认API地址
  API_BASE_URL: 'http://127.0.0.1',
  
  // API版本
  API_VERSION: 'v1',
  
  // 超时设置
  TIMEOUT: 10000,
  
  // 验证码接口
  CAPTCHA: {
    CREATE: '/v1/index/captcha/create',
    VERIFY: '/v1/index/captcha/verify'
  },
  
  // 认证接口
  AUTH: {
    LOGIN: '/v1/user/login/',
    REGISTER: '/v1/user/register/',
    USER_INFO: '/v1/user/info/'
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