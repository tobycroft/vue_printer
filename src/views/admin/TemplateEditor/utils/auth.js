// 获取认证头信息
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

export {
  getAuthHeaders
}