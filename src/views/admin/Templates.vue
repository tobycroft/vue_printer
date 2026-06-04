<template>
  <div class="templates-container">
    <!-- 模板列表视图 -->
    <div class="list-view">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h2>打印模板管理</h2>
            <p>查看和管理所有打印模板</p>
          </div>
          <button class="btn btn-primary add-btn" @click="goToEditor()">
            <span class="btn-icon">➕</span>
            新增模板
          </button>
        </div>
      </div>

      <!-- 模板列表 -->
      <div v-if="templates.length > 0" class="templates-list">
        <table class="templates-table">
          <thead>
            <tr>
              <th>模板名称</th>
              <th>纸张尺寸</th>
              <th>预设尺寸</th>
              <th>创建时间</th>
              <th>修改时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template.id">
              <td>{{ template.name }}</td>
              <td>{{ template.paperWidth }} × {{ template.paperHeight }} mm</td>
              <td>{{ template.presetSize || '-' }}</td>
              <td>{{ formatDate(template.createdAt) }}</td>
              <td>{{ formatDate(template.updatedAt) }}</td>
              <td class="actions">
                <button class="btn btn-secondary" @click="goToEditor(template.id)">修改</button>
                <button class="btn btn-danger" @click="deleteTemplate(template.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 无模板提示 -->
      <div v-else class="no-templates">
        <p>暂无打印模板</p>
        <button class="btn btn-primary" @click="goToEditor()">新建模板</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { templateApi } from './TemplateEditor/api/template'
import { message } from './TemplateEditor/utils/message'

const templates = ref([])

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  try {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  } catch (e) {
    return timestamp
  }
}

const fetchTemplates = async () => {
  try {
    const result = await templateApi.getTemplates()
    // go_printer返回的格式是{code:0, data:[], echo:''}
    if (result.code === 0) {
      // 将后端字段映射为前端格式
      templates.value = result.data.map(item => ({
        id: item.id,
        name: item.template_name,
        paperWidth: item.width,
        paperHeight: item.height,
        presetSize: item.preset_size,
        createdAt: item.create_time,
        updatedAt: item.update_time,
        controls: [] // 控件数据在详情页获取
      }))
    } else {
      message.error(result.echo || '获取模板列表失败')
    }
  } catch (error) {
    console.error('获取模板列表失败:', error)
    message.error(error.message || '获取模板列表失败')
  }
}

const goToEditor = async (templateId = '') => {
  if (templateId) {
    window.location.href = `#/template-editor?id=${templateId}`
  } else {
    // 新建模板：先调用add接口创建模板
    try {
      // 生成默认模板名称：默认模板+日期
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
      const defaultName = `默认模板${dateStr}${timeStr}`
      
      // 创建模板
      const result = await templateApi.createTemplate({
        template_name: defaultName,
        width: 210,
        height: 297,
        preset_size: 'A4'
      })
      
      // 使用返回的template_id进入编辑页面
      if (result.code === 0 && result.data && result.data.id) {
        window.location.href = `#/template-editor?id=${result.data.id}`
      } else {
        message.error(result.echo || '创建模板失败：未获取到模板ID')
      }
    } catch (error) {
      console.error('创建模板失败:', error)
      message.error(error.message || '创建模板失败')
    }
  }
}

const deleteTemplate = async (id) => {
  try {
        const result = await templateApi.deleteTemplate(id)
        if (result.code === 0) {
          await fetchTemplates()
          message.success('模板删除成功')
        } else {
          message.error(result.echo || '删除失败')
        }
      } catch (error) {
        console.error('删除模板失败:', error)
        message.error(error.message || '删除失败')
      }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.templates-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* 列表视图样式 */
.list-view {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-text h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
}

.header-text p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s ease;
}

.btn-primary {
  background: #00d8ff;
  color: #1a1a1a;
}

.btn-primary:hover {
  background: #00b8e6;
}

.btn-secondary {
  background: #3d3d3d;
  color: white;
}

.btn-secondary:hover {
  background: #4d4d4d;
}

.btn-danger {
  background: #ff4757;
  color: white;
}

.btn-danger:hover {
  background: #ff3742;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-icon {
  font-size: 14px;
}

.templates-list {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  overflow: hidden;
}

.templates-table {
  width: 100%;
  border-collapse: collapse;
}

.templates-table th,
.templates-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #3d3d3d;
}

.templates-table th {
  background: #3d3d3d;
  color: #ffffff;
  font-weight: 600;
}

.templates-table td {
  color: #e0e0e0;
}

.templates-table tr:hover {
  background: #353535;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions .btn {
  font-size: 12px;
  padding: 4px 10px;
}

.no-templates {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.no-templates p {
  margin: 0 0 20px 0;
  color: #999;
  font-size: 16px;
}
</style>