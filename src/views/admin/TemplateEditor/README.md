# 模板编辑器API调用说明

## 概述
本模板编辑器已集成与go_printer后端API的调用功能，支持模板的创建、更新、删除以及控件的增删改查操作。

## API结构

### 1. API封装
`api/template.js` - API请求封装文件，包含：
- axios实例配置
- 请求/响应拦截器
- 模板相关API方法
- 模板控件相关API方法

### 2. 组合式函数集成

#### useTemplateEditor.js
- `loadTemplate()` - 加载模板数据
- `saveTemplate()` - 保存模板（创建或更新）
- 自动处理加载和保存状态

#### useControlOperations.js
- `loadTemplateControls()` - 加载模板控件
- `onDrop()` - 拖拽添加控件（调用API）
- `watchControlUpdates()` - 控件属性变化时自动更新到API
- `deleteControl()` - 删除控件

## API接口说明

### 模板接口

#### 获取模板列表
```javascript
POST /api/v1/template/info
```

#### 获取单个模板
```javascript
POST /api/v1/template/info/get
参数: { id: 模板ID }
```

#### 创建模板
```javascript
POST /api/v1/template/info/add
参数: {
  template_name: 模板名称,
  width: 纸张宽度,
  height: 纸张高度,
  preset_size: 预设尺寸（可选）
}
```

#### 更新模板
```javascript
POST /api/v1/template/info/update
参数: {
  id: 模板ID,
  template_name: 模板名称（可选）,
  width: 纸张宽度（可选）,
  height: 纸张高度（可选）,
  preset_size: 预设尺寸（可选）
}
```

#### 删除模板
```javascript
POST /api/v1/template/info/delete
参数: { id: 模板ID }
```

### 控件接口

#### 获取模板控件列表
```javascript
POST /api/v1/template/detail
参数: { template_id: 模板ID }
```

#### 获取单个控件
```javascript
POST /api/v1/template/detail/get
参数: { id: 控件ID }
```

#### 添加控件
```javascript
POST /api/v1/template/detail/add
参数: {
  template_id: 模板ID,
  type: 控件类型（text/data_text/line/image）,
  x: X坐标,
  y: Y坐标,
  width: 宽度,
  height: 高度,
  content: 内容（根据类型不同含义不同）,
  font_size: 字号（仅文本类型）,
  font_weight: 字体粗细（仅文本类型）,
  align: 对齐方式（仅文本类型）
}
```

#### 更新控件
```javascript
POST /api/v1/template/detail/update
参数: {
  id: 控件ID,
  // 以下参数可选，根据控件类型提供
  x: X坐标,
  y: Y坐标,
  width: 宽度,
  height: 高度,
  content: 内容,
  font_size: 字号,
  font_weight: 字体粗细,
  align: 对齐方式
}
```

#### 删除控件
```javascript
POST /api/v1/template/detail/delete
参数: { id: 控件ID }
```

## 数据格式转换

### 文本控件
- API格式: `{ content: '文本', font_size: 14, font_weight: 'normal', align: 'left' }`
- 本地格式: `{ text: '文本', fontSize: 14, fontWeight: 'normal', align: 'left' }`

### 数据文本控件
- API格式: `{ content: '前缀[数据文本]' }`
- 本地格式: `{ placeholderMode: 'prefix', placeholderText: '前缀' }`

### 图片控件
- API格式: `{ content: 'barcode' }`
- 本地格式: `{ imageType: 'barcode' }`

## 错误处理

- 使用Element Plus的ElMessage组件显示错误信息
- API调用失败时自动显示错误提示
- 网络错误和业务错误统一处理

## 注意事项

1. **跨域问题**: 确保后端已配置CORS或前端已配置代理
2. **Token认证**: 从localStorage获取token，确保用户已登录
3. **数据一致性**: 先更新本地数据再调用API，提升用户体验
4. **加载状态**: 所有异步操作都有loading状态提示
5. **错误重试**: 关键操作建议添加重试机制

## 测试建议

1. 测试模板创建、编辑、删除功能
2. 测试控件的增删改查操作
3. 测试网络异常情况下的错误处理
4. 测试未登录状态下的API调用拦截
5. 测试数据格式转换的正确性