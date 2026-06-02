import { request, requestWithForm } from './apiService'

async function getAuthHeaders() {
  let uid = ''
  let token = ''
  
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get('vue_printer_user_data', resolve)
      })
      
      if (result && result.vue_printer_user_data) {
        uid = result.vue_printer_user_data.uid
        token = result.vue_printer_user_data.token
      }
    }
    
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

function generateFingerprint() {
  let fingerprint = localStorage.getItem('device_fingerprint')
  if (!fingerprint) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
    const data = canvas.toDataURL()
    fingerprint = data.replace(/[^a-zA-Z0-9]/g, '').slice(-32)
    localStorage.setItem('device_fingerprint', fingerprint)
  }
  return fingerprint
}

function getComputerName() {
  let name = localStorage.getItem('computer_name')
  if (!name) {
    name = '我的电脑'
    localStorage.setItem('computer_name', name)
  }
  return name
}

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

export async function deletePrinter(id) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('id', id)

    const response = await requestWithForm('/v1/device/info/delete', formData, headers)

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

export async function getDeviceConfig() {
  try {
    const headers = await getAuthHeaders()
    const fingerprint = generateFingerprint()
    const formData = new FormData()
    formData.append('fingerprint', fingerprint)

    const response = await requestWithForm('/v1/device/config/get', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '获取配置成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取配置失败'
      };
    }
  } catch (error) {
    console.error('获取配置错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

export async function saveDeviceConfig(port) {
  try {
    const headers = await getAuthHeaders()
    const fingerprint = generateFingerprint()
    const formData = new FormData()
    formData.append('fingerprint', fingerprint)
    formData.append('port', port)

    const response = await requestWithForm('/v1/device/config/save', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '保存配置成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '保存配置失败'
      };
    }
  } catch (error) {
    console.error('保存配置错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

export async function getLocalDevices() {
  try {
    const headers = await getAuthHeaders()
    const fingerprint = generateFingerprint()
    const formData = new FormData()
    formData.append('fingerprint', fingerprint)

    const response = await requestWithForm('/v1/device/info/list', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '获取本地打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '获取本地打印机失败'
      };
    }
  } catch (error) {
    console.error('获取本地打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

export async function addLocalDevice(deviceName, remark) {
  try {
    const headers = await getAuthHeaders()
    const fingerprint = generateFingerprint()
    const computerName = getComputerName()
    const formData = new FormData()
    formData.append('device_name', deviceName)
    formData.append('fingerprint', fingerprint)
    formData.append('computer_name', computerName)
    if (remark) {
      formData.append('remark', remark)
    }

    const response = await requestWithForm('/v1/device/info/add', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '添加本地打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '添加本地打印机失败'
      };
    }
  } catch (error) {
    console.error('添加本地打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

export async function deleteLocalDevice(id) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('id', id)

    const response = await requestWithForm('/v1/device/info/delete', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '删除本地打印机成功'
      };
    } else {
      return {
        success: false,
        message: response.echo || '删除本地打印机失败'
      };
    }
  } catch (error) {
    console.error('删除本地打印机错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败'
    };
  }
}

export async function updateLocalDevice(id, deviceName, remark) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('id', id)
    formData.append('device_name', deviceName)
    formData.append('remark', remark)

    const response = await requestWithForm('/v1/device/info/update', formData, headers)

    if (response.code === 0) {
      return {
        success: true,
        data: response.data,
        message: response.echo || '更新本地打印机成功'
      }
    } else {
      return {
        success: false,
        message: response.echo || '更新本地打印机失败'
      }
    }
  } catch (error) {
    console.error('更新本地打印机错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

export { generateFingerprint, getComputerName }
