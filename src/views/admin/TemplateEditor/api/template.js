import { fetchApi } from '../utils/fetch'

// 创建API实例
const api = {
  post: (url, data = {}) => {
    return fetchApi.post(`/api/v1${url}`, data)
  },
  get: (url, params = {}) => {
    return fetchApi.get(`/api/v1${url}`, params)
  }
}

// 模板相关API
export const templateApi = {
  // 获取模板列表
  getTemplates: () => {
    return api.post('/template/info')
  },

  // 获取单个模板
  getTemplate: (id) => {
    return api.post('/template/info/get', { id })
  },

  // 创建模板
  createTemplate: (data) => {
    return api.post('/template/info/add', data)
  },

  // 更新模板
  updateTemplate: (id, data) => {
    return api.post('/template/info/update', { id, ...data })
  },

  // 删除模板
  deleteTemplate: (id) => {
    return api.post('/template/info/delete', { id })
  }
}

// 模板控件相关API
export const templateDetailApi = {
  // 获取模板控件列表
  getTemplateDetails: (templateId) => {
    return api.post('/template/detail', { template_id: templateId })
  },

  // 获取单个控件
  getTemplateDetail: (id) => {
    return api.post('/template/detail/get', { id })
  },

  // 添加控件
  addTemplateDetail: (data) => {
    return api.post('/template/detail/add', data)
  },

  // 更新控件
  updateTemplateDetail: (id, data) => {
    return api.post('/template/detail/update', { id, ...data })
  },

  // 删除控件
  deleteTemplateDetail: (id) => {
    return api.post('/template/detail/delete', { id })
  }
}

export default api