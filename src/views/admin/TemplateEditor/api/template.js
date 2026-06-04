import { request, requestWithForm } from '@/services/apiService'
import { getAuthHeaders } from '../utils/auth'

// 创建API实例
const api = {
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

// 模板相关API
export const templateApi = {
  // 获取模板列表
  getTemplates: () => {
    return api.get('/')
  },
  
  // 获取单个模板
  getTemplate: (id) => {
    return api.postForm('/get', { id })
  },
  
  // 创建模板
  createTemplate: (data) => {
    return api.postForm('/add', data)
  },
  
  // 更新模板
  updateTemplate: (id, data) => {
    return api.postForm('/update', { id, ...data })
  },
  
  // 删除模板
  deleteTemplate: (id) => {
    return api.postForm('/delete', { id })
  }
}

// 模板控件相关API
export const templateDetailApi = {
  // 获取模板控件列表
  getTemplateDetails: (templateId) => {
    return api.postForm('/detail', { template_id: templateId })
  },

  // 获取单个控件
  getTemplateDetail: (id) => {
    return api.postForm('/detail/get', { id })
  },

  // 添加模板控件
  addTemplateDetail: (data) => {
    return api.postForm('/detail/add', data)
  },

  // 更新模板控件
  updateTemplateDetail: (id, data) => {
    return api.postForm('/detail/update', { id, ...data })
  },

  // 删除模板控件
  deleteTemplateDetail: (id) => {
    return api.postForm('/detail/delete', { id })
  }
}

export default api