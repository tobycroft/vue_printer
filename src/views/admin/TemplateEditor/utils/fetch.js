// 简单的fetch封装，替代axios
export const fetchApi = {
  post: async (url, data = {}) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        headers['token'] = token
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const res = await response.json()
      
      // 处理后端返回格式
      if (res.code !== 0 && res.code !== 200) {
        throw new Error(res.msg || '请求失败')
      }
      
      return res.data || res
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  },
  
  get: async (url, params = {}) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        headers['token'] = token
      }
      
      const queryString = new URLSearchParams(params).toString()
      const fullUrl = queryString ? `${url}?${queryString}` : url
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const res = await response.json()
      
      // 处理后端返回格式
      if (res.code !== 0 && res.code !== 200) {
        throw new Error(res.msg || '请求失败')
      }
      
      return res.data || res
    } catch (error) {
      console.error('Fetch error:', error)
      throw error
    }
  }
}