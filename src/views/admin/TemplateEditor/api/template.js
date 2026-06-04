import axios from 'axios'

// 创建API实例
const api = axios.create({
  baseURL: '/api/v1', // 假设API前缀是/api/v1
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      config.headers['token'] = token // 有些后端可能直接用token字段
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    // 假设后端返回格式：{ code: 0, data: {}, msg: '' }
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      // 处理错误
      console.error('API Error:', res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res.data || res
  },
  (error) => {
    console.error('Network Error:', error.message)
    return Promise.reject(error)
  }
)

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