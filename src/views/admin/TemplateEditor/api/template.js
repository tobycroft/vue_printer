import { request, requestWithForm } from '@/services/apiService'
import { getAuthHeaders } from '../utils/auth'

// 创建模板信息API实例
const infoApi = {
  post: async (url, data = {}) => {
    const headers = await getAuthHeaders()
    return request(`/v1/template/info${url}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    })
  },
  
  get: async (url, params = {}) => {
    const headers = await getAuthHeaders()
    // 构建查询字符串
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = queryString ? `/v1/template/info${url}?${queryString}` : `/v1/template/info${url}`
    return request(fullUrl, {
      method: 'GET',
      headers: headers
    })
  },
  
  // 使用FormData提交的POST请求
  postForm: async (url, data = {}) => {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key])
      }
    }
    return requestWithForm(`/v1/template/info${url}`, formData, headers)
  }
}

// 创建模板详情API实例
const detailApi = {
  // 使用FormData提交的POST请求
  postForm: async (url, data = {}) => {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        formData.append(key, data[key])
      }
    }
    return requestWithForm(`/v1/template/detail${url}`, formData, headers)
  }
}

// 模板相关API
export const templateApi = {
  // 获取模板列表
  getTemplates: () => {
    return infoApi.postForm('/', {})
  },
  
  // 获取单个模板
  getTemplate: (id) => {
    return infoApi.postForm('/get', { id })
  },
  
  // 创建模板
  createTemplate: (data) => {
    return infoApi.postForm('/add', data)
  },
  
  // 更新模板
  updateTemplate: (id, data) => {
    // 只有当 id 存在时才添加到请求中
    const requestData = id ? { id, ...data } : data
    return infoApi.postForm('/update', requestData)
  },
  
  // 删除模板
  deleteTemplate: (id) => {
    return infoApi.postForm('/delete', { id })
  }
}

// 模板详情相关API
export const templateDetailApi = {
  // 获取模板的控件列表
  getTemplateDetails: (templateId) => {
    return detailApi.postForm('/', { template_id: templateId })
  },
  
  // 获取单个控件
  getTemplateDetail: (id) => {
    return detailApi.postForm('/get', { id })
  },
  
  // 添加控件
  addTemplateDetail: (data) => {
    return detailApi.postForm('/add', data)
  },
  
  // 更新控件
  updateTemplateDetail: (id, data) => {
    const requestData = { id, ...data }
    return detailApi.postForm('/update', requestData)
  },
  
  // 删除控件
  deleteTemplateDetail: (id) => {
    return detailApi.postForm('/delete', { id })
  }
}

export default infoApi