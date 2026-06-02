// API基础配置
const DEFAULT_API_BASE_URL = 'https://printapi.tuuz.ltd:444';

function getApiBaseUrl() {
  let url = ''
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      // 优先从 chrome.storage 读取
      url = localStorage.getItem('api_base_url') || ''
    }
    if (!url) {
      url = localStorage.getItem('api_base_url') || ''
    }
  } catch (error) {
    console.error('读取API地址错误:', error)
  }
  return url || DEFAULT_API_BASE_URL
}

function saveApiBaseUrl(url) {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'api_base_url': url })
    }
    localStorage.setItem('api_base_url', url)
  } catch (error) {
    console.error('保存API地址错误:', error)
  }
}

/**
 * 通用请求方法
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @returns {Promise} 响应数据
 */
async function request(url, options = {}) {
  const apiBaseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${apiBaseUrl}${url}`, {
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
 * 带超时的请求方法
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {Promise} 响应数据
 */
async function requestWithTimeout(url, options = {}, timeout = 10000) {
  const apiBaseUrl = getApiBaseUrl()
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(`${apiBaseUrl}${url}`, {
      ...options,
      signal: controller.signal
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 使用FormData发送请求
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {Object} headers - 请求头
 * @param {Object} options - 请求选项
 * @returns {Promise} 请求结果
 */
async function requestWithForm(url, formData, headers = {}, options = {}) {
  const requestOptions = {
    method: options.method || 'POST',
    headers: {
      ...headers
    },
    body: formData
  };

  return await request(url, requestOptions);
}

// ==================== 认证相关API ====================

/**
 * 用户登录 (JSON方式)
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} captcha - 验证码
 * @returns {Promise} 登录结果
 */
export async function login(username, password, captcha) {
  try {
    const response = await request('/auth/login', {
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
 * 用户登录 (FormData方式)
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} ident - 验证码标识
 * @param {string} code - 验证码
 * @returns {Promise} 登录结果
 */
export async function loginWithForm(username, password, ident, code) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('ident', ident);
  formData.append('code', code);

  try {
    const response = await requestWithForm('/v1/user/login/', formData);
    
    if (response.code === 0) {
      return {
        success: true,
        data: {
          uid: response.data.uid,
          token: response.data.token || '',
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        },
        message: response.echo || '登录成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '操作失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 用户注册 (JSON方式)
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} captcha - 验证码
 * @returns {Promise} 注册结果
 */
export async function register(username, password, captcha) {
  try {
    const response = await request('/auth/register', {
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
 * 用户注册 (FormData方式)
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} ident - 验证码标识
 * @param {string} code - 验证码
 * @returns {Promise} 注册结果
 */
export async function registerWithForm(username, password, ident, code) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('ident', ident);
  formData.append('code', code);

  try {
    const response = await requestWithForm('/v1/user/register/', formData);
    
    if (response.code === 0) {
      return {
        success: true,
        data: {
          uid: response.data.uid,
          token: response.data.token || '',
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        },
        message: response.echo || '注册成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '操作失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 获取用户基本信息 (username)
 * @param {string} uid - 用户ID
 * @param {string} token - 用户Token
 * @returns {Promise} 用户信息
 */
export async function getUserInfo(uid, token) {
  try {
    const response = await request('/v1/user/info/', {
      method: 'POST',
      headers: {
        'uid': uid,
        'token': token
      }
    });

    if (response.code === 0 && response.data) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '获取成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 获取用户详细信息 (nickname等)
 * @param {string} uid - 用户ID
 * @returns {Promise} 用户详细信息
 */
export async function getUserInfoDetail(uid) {
  try {
    // 从chrome.storage.local获取token
    let token = ''
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('vue_printer_user_data', resolve)
      })
      
      if (result && result.vue_printer_user_data) {
        token = result.vue_printer_user_data.token || ''
      }
    }
    
    // 如果chrome.storage中没有，尝试从localStorage获取（兼容旧版本）
    if (!token) {
      const authInfo = JSON.parse(localStorage.getItem('auth_info') || '{}')
      token = authInfo.token || ''
    }

    const apiBaseUrl = getApiBaseUrl()
    const response = await fetch(`${apiBaseUrl}/v1/user/info/get`, {
      method: 'GET',
      headers: {
        'uid': uid,
        'token': token
      }
    });

    const data = await response.json();

    if (data.code === 0 && data.data) {
      return {
        success: true,
        data: data.data,
        message: data.echo || '获取成功'
      };
    } else {
      return {
        success: false,
        message: data.echo || '获取失败'
      };
    }
  } catch (error) {
    console.error('获取用户详细信息错误:', error);
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
export async function refreshToken(refreshToken) {
  try {
    const response = await request('/auth/refresh', {
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
export async function logout(token) {
  try {
    await request('/auth/logout', {
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

// ==================== 验证码相关API ====================

/**
 * 创建验证码
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {Promise} 验证码信息
 */
export async function createCaptcha(timeout = 10000) {
  try {
    const response = await requestWithTimeout('/v1/index/captcha/create', {
      method: 'GET'
    }, timeout);

    if (response.code === 0) {
      return {
        success: true,
        data: {
          ident: response.data.ident,
          image: response.data.image
        },
        message: response.echo || '获取成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取失败'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message || '网络请求超时'
    };
  }
}

// 导出基础请求方法

export { request, requestWithTimeout, requestWithForm };

// ==================== 用户信息更新API ====================

/**
 * 更新用户信息
 * @param {Object} userData - 用户信息
 * @param {string} userData.nickname - 昵称
 * @param {string} userData.avatar - 头像URL
 * @param {string} userData.phone - 手机号
 * @param {string} userData.email - 邮箱
 * @param {string} userData.gender - 性别(male/female/secret)
 * @param {string} userData.birthday - 生日(YYYY-MM-DD)
 * @param {string} userData.address - 联系地址
 * @returns {Promise} 更新结果
 */
export async function updateUserInfo(userData) {
  try {
    // 从chrome.storage.local获取token
    let uid = ''
    let token = ''
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('vue_printer_user_data', resolve)
      })
      
      if (result && result.vue_printer_user_data) {
        uid = result.vue_printer_user_data.uid || ''
        token = result.vue_printer_user_data.token || ''
      }
    }
    
    // 如果chrome.storage中没有，尝试从localStorage获取（兼容旧版本）
    if (!uid || !token) {
      const authInfo = JSON.parse(localStorage.getItem('auth_info') || '{}')
      uid = authInfo.uid || ''
      token = authInfo.token || ''
    }

    if (!uid || !token) {
      return {
        success: false,
        message: '未登录，请先登录'
      }
    }

    const formData = new FormData()
    formData.append('uid', uid)
    
    // 添加需要更新的字段
    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined && userData[key] !== '') {
        formData.append(key, userData[key])
      }
    })

    const apiBaseUrl = getApiBaseUrl()
    const response = await fetch(`${apiBaseUrl}/v1/user/info/update`, {
      method: 'POST',
      headers: {
        'uid': uid,
        'token': token
      },
      body: formData
    })

    const data = await response.json()

    if (data.code === 0) {
      return {
        success: true,
        message: data.echo || '更新成功'
      }
    } else {
      return {
        success: false,
        message: data.echo || '更新失败'
      }
    }
  } catch (error) {
    console.error('更新用户信息错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

// ==================== 服务器检测API ====================

/**
 * 检测服务器连通性
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {Promise<boolean>} 是否连通
 */
export async function checkServerConnectivity(timeout = 3000, customUrl) {
  try {
    const apiBaseUrl = customUrl || getApiBaseUrl()
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    await fetch(apiBaseUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.error('服务器连通性检测失败:', error);
    return false;
  }
}

export { getApiBaseUrl, saveApiBaseUrl, DEFAULT_API_BASE_URL };
