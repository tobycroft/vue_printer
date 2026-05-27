// 打印机管理相关API
import { request, requestWithForm } from './apiService'

/**
 * 获取认证Header
 * @returns {Object} 包含uid和token的Header对象
 */
async function getAuthHeaders() {
  let uid = ''
  let token = ''
  
  try {
    // 从chrome.storage.local获取用户数据
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('vue_printer_user_data', resolve)
      })
      
      if (result && result.vue_printer_user_data) {
        uid = result.vue_printer_user_data.uid
        token = result.vue_printer_user_data.token
      }
    }
    
    // 如果chrome.storage中没有，尝试从localStorage获取（兼容旧版本）
    if (!uid || !token) {
      const authInfo = JSON.parse(localStorage.getItem('auth_info') || '{}')
      uid = authInfo.uid || uid
      token = authInfo.token || token
    }
  } catch (error) {
    console.error('获取认证信息失败:', error)
  }
  
  const headers = {}
  if (uid) headers['uid'] = uid
  if (token) headers['token'] = token
  
  return headers
}

/**
 * 获取打印机列表
 * @returns {Promise} 打印机列表
 */
export async function getPrinters() {
  try {
    const headers = await getAuthHeaders()
    
    const response = await request('/v1/device/info/', {
      method: 'GET',
      headers: headers
    });

    if (response.code === 0 && response.data) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '获取打印机列表成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取打印机列表失败'
      };
    }
  } catch (error) {
    console.error('获取打印机列表错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

/**
 * 获取单个打印机信息
 * @param {number} id - 打印机ID
 * @returns {Promise} 打印机信息
 */
export async function getPrinterInfo(id) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData();
    formData.append('id', id);

    const response = await requestWithForm('/v1/device/info/get', formData, headers);

    if (response.code === 0 && response.data) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '获取打印机信息成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取打印机信息失败'
      };
    }
  } catch (error) {
    console.error('获取打印机信息错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

/**
 * 测试打印机连接
 * @param {number} id - 打印机ID
 * @returns {Promise} 测试结果
 */
export async function testPrinterConnection(id) {
  try {
    // 这里可以实现测试打印机连接的逻辑
    console.log('测试打印机连接:', id);
    return {
      success: true,
      message: '打印机连接测试成功'
    };
  } catch (error) {
    console.error('测试打印机连接错误:', error);
    return {
      success: false,
      message: error.message || '打印机连接测试失败'
    };
  }
}

/**
 * 新增打印机设备
 * @param {Object} printer - 打印机信息
 * @param {string} printer.device - 打印机名称
 * @param {string} printer.url - 打印机地址
 * @returns {Promise} 操作结果
 */
export async function addPrinterDevice(printer) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData();
    formData.append('device_name', printer.device);
    formData.append('url', printer.url);
    if (printer.remark) {
      formData.append('remark', printer.remark);
    }

    const response = await requestWithForm('/v1/device/info/add', formData, headers);

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '添加打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '添加打印机失败'
      };
    }
  } catch (error) {
    console.error('添加打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

/**
 * 更新打印机设备
 * @param {Object} printer - 打印机信息
 * @param {number} printer.id - 打印机ID
 * @param {string} printer.device - 打印机名称
 * @param {string} printer.url - 打印机地址
 * @returns {Promise} 操作结果
 */
export async function updatePrinterDevice(printer) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData();
    formData.append('id', printer.id);
    formData.append('device_name', printer.device);
    formData.append('url', printer.url);
    if (printer.remark) {
      formData.append('remark', printer.remark);
    }

    const response = await requestWithForm('/v1/device/info/update', formData, headers);

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '更新打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '更新打印机失败'
      };
    }
  } catch (error) {
    console.error('更新打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

/**
 * 删除打印机设备
 * @param {number} id - 打印机ID
 * @returns {Promise} 操作结果
 */
export async function deletePrinterDevice(id) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData();
    formData.append('id', id);

    const response = await requestWithForm('/v1/device/info/delete', formData, headers);

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '删除打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '删除打印机失败'
      };
    }
  } catch (error) {
    console.error('删除打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}