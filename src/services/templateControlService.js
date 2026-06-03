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

// 序列化控件数据为后端格式
function serializeControl(control) {
  const result = {
    type: control.type,
    tag: control.tag || '',
    content: '',
    font_size: control.fontSize || 12,
    font_weight: control.fontWeight || 'normal',
    align: control.align || 'left',
    width: Math.round(control.width || 100),
    height: Math.round(control.height || 50),
    x: Math.round(control.x || 0),
    y: Math.round(control.y || 0)
  }
  
  // 根据控件类型处理 content
  if (control.type === 'text') {
    result.content = control.text || ''
  } else if (control.type === 'data_text') {
    // 保存占位模式和占位文本
    result.content = JSON.stringify({
      placeholderMode: control.placeholderMode || 'prefix',
      placeholderText: control.placeholderText || ''
    })
  } else if (control.type === 'line') {
    result.content = JSON.stringify({
      borderWidth: control.borderWidth || 1
    })
  } else if (control.type === 'image') {
    result.content = JSON.stringify({
      imageType: control.imageType || 'barcode'
    })
  }
  
  return result
}

// 从后端格式反序列化控件
function deserializeControl(dbControl) {
  const result = {
    id: dbControl.id,
    type: dbControl.type,
    tag: dbControl.tag || '',
    fontSize: dbControl.font_size || 12,
    fontWeight: dbControl.font_weight || 'normal',
    align: dbControl.align || 'left',
    width: dbControl.width || 100,
    height: dbControl.height || 50,
    x: dbControl.x || 0,
    y: dbControl.y || 0
  }
  
  // 根据控件类型解析 content
  try {
    if (dbControl.type === 'text') {
      result.text = dbControl.content || ''
    } else if (dbControl.type === 'data_text') {
      const data = JSON.parse(dbControl.content || '{}')
      result.placeholderMode = data.placeholderMode || 'prefix'
      result.placeholderText = data.placeholderText || ''
    } else if (dbControl.type === 'line') {
      const data = JSON.parse(dbControl.content || '{}')
      result.borderWidth = data.borderWidth || 1
    } else if (dbControl.type === 'image') {
      const data = JSON.parse(dbControl.content || '{}')
      result.imageType = data.imageType || 'barcode'
    }
  } catch (e) {
    console.warn('解析控件 content 失败', e)
  }
  
  return result
}

// 获取模板的所有控件
export async function getTemplateControls(templateId) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('template_id', templateId)
    
    const response = await requestWithForm('/v1/template/detail/', formData, headers)
    
    if (response.code === 0) {
      const controls = (response.data || []).map(deserializeControl)
      return {
        success: true,
        data: controls,
        message: response.echo || '获取控件列表成功'
      }
    } else {
      return {
        success: false,
        message: response.echo || '获取控件列表失败'
      }
    }
  } catch (error) {
    console.error('获取控件列表错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

// 添加控件
export async function addControl(templateId, control) {
  try {
    const headers = await getAuthHeaders()
    const data = serializeControl(control)
    const formData = new FormData()
    formData.append('template_id', templateId)
    formData.append('type', data.type)
    formData.append('tag', data.tag)
    formData.append('content', data.content)
    formData.append('font_size', data.font_size.toString())
    formData.append('font_weight', data.font_weight)
    formData.append('align', data.align)
    formData.append('width', data.width.toString())
    formData.append('height', data.height.toString())
    formData.append('x', data.x.toString())
    formData.append('y', data.y.toString())
    
    const response = await requestWithForm('/v1/template/detail/add', formData, headers)
    
    if (response.code === 0) {
      return {
        success: true,
        message: response.echo || '添加控件成功'
      }
    } else {
      return {
        success: false,
        message: response.echo || '添加控件失败'
      }
    }
  } catch (error) {
    console.error('添加控件错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

// 更新控件
export async function updateControl(controlId, updates) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('id', controlId)
    
    const data = serializeControl({
      ...updates,
      type: updates.type || 'text'
    })
    
    if (updates.type !== undefined) formData.append('type', data.type)
    if (updates.tag !== undefined) formData.append('tag', data.tag)
    if (updates.text !== undefined || updates.placeholderText !== undefined) formData.append('content', data.content)
    if (updates.fontSize !== undefined) formData.append('font_size', data.font_size.toString())
    if (updates.fontWeight !== undefined) formData.append('font_weight', data.font_weight)
    if (updates.align !== undefined) formData.append('align', data.align)
    if (updates.width !== undefined) formData.append('width', data.width.toString())
    if (updates.height !== undefined) formData.append('height', data.height.toString())
    if (updates.x !== undefined) formData.append('x', data.x.toString())
    if (updates.y !== undefined) formData.append('y', data.y.toString())
    
    const response = await requestWithForm('/v1/template/detail/update', formData, headers)
    
    if (response.code === 0) {
      return {
        success: true,
        message: response.echo || '更新控件成功'
      }
    } else {
      return {
        success: false,
        message: response.echo || '更新控件失败'
      }
    }
  } catch (error) {
    console.error('更新控件错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}

// 删除控件
export async function deleteControl(controlId) {
  try {
    const headers = await getAuthHeaders()
    const formData = new FormData()
    formData.append('id', controlId)
    
    const response = await requestWithForm('/v1/template/detail/delete', formData, headers)
    
    if (response.code === 0) {
      return {
        success: true,
        message: response.echo || '删除控件成功'
      }
    } else {
      return {
        success: false,
        message: response.echo || '删除控件失败'
      }
    }
  } catch (error) {
    console.error('删除控件错误:', error)
    return {
      success: false,
      message: error.message || '网络请求失败'
    }
  }
}
