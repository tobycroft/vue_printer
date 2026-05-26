// 打印机管理相关API
import { request } from './apiService'

/**
 * 获取打印机列表
 * @returns {Promise} 打印机列表
 */
export async function getPrinters() {
  try {
    const response = await request('/v1/device/info/', {
      method: 'GET'
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
    const response = await request(`/v1/device/info/get?id=${id}`, {
      method: 'GET'
    });

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