<template>
  <div class="templates-container">
    <div class="templates-header">
      <h2>模板管理</h2>
      <p>创建和管理您的打印模板</p>
    </div>

    <div class="templates-grid">
      <div v-if="templates.length === 0" class="empty-state">
        <div class="empty-icon">📄</div>
        <p>暂无模板</p>
        <small>点击"创建新模板"开始使用</small>
      </div>

      <div v-else class="template-list">
        <div v-for="template in templates" :key="template.id" class="template-card">
          <div class="template-info">
            <h3>{{ template.name }}</h3>
            <p>{{ template.description || '暂无描述' }}</p>
          </div>
          <div class="template-actions">
            <button class="btn btn-edit" @click="editTemplate(template)">编辑</button>
            <button class="btn btn-danger" @click="deleteTemplate(template.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn btn-primary" @click="createTemplate">
        + 创建新模板
      </button>
    </div>

    <!-- 模板编辑对话框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingId ? '编辑模板' : '创建模板' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>模板名称 *</label>
            <input 
              v-model="templateForm.name" 
              type="text" 
              placeholder="例如：发票模板"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input 
              v-model="templateForm.description" 
              type="text" 
              placeholder="简要描述..."
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>HTML 模板内容 *</label>
            <textarea 
              v-model="templateForm.content" 
              placeholder="<html>
<body>
  <h1>{{title}}</h1>
  <p>{{content}}</p>
</body>
</html>"
              class="form-control textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveTemplate">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const templates = ref([])
const showModal = ref(false)
const editingId = ref(null)
const templateForm = ref({
  name: '',
  description: '',
  content: ''
})

onMounted(async () => {
  await loadTemplates()
})

const loadTemplates = async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPrintTemplates' })
    templates.value = response.templates || []
  } catch (error) {
    console.error('加载模板失败:', error)
  }
}

const createTemplate = () => {
  editingId.value = null
  templateForm.value = { name: '', description: '', content: '' }
  showModal.value = true
}

const editTemplate = (template) => {
  editingId.value = template.id
  templateForm.value = { ...template }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingId.value = null
}

const saveTemplate = async () => {
  if (!templateForm.value.name || !templateForm.value.content) {
    alert('请填写必填项')
    return
  }

  const template = {
    id: editingId.value || `template_${Date.now()}`,
    ...templateForm.value,
    updatedAt: new Date().toISOString()
  }

  try {
    await chrome.runtime.sendMessage({
      action: 'savePrintTemplate',
      template
    })
    
    alert(editingId.value ? '模板已更新' : '模板已创建')
    closeModal()
    await loadTemplates()
  } catch (error) {
    console.error('保存模板失败:', error)
    alert('保存失败')
  }
}

const deleteTemplate = async (id) => {
  if (!confirm('确定要删除此模板吗？')) return

  try {
    await chrome.runtime.sendMessage({
      action: 'deletePrintTemplate',
      templateId: id
    })
    
    alert('模板已删除')
    await loadTemplates()
  } catch (error) {
    console.error('删除模板失败:', error)
    alert('删除失败')
  }
}
</script>

<style scoped>
.templates-container {
  max-width: 1200px;
  margin: 0 auto;
}

.templates-header {
  margin-bottom: 30px;
}

.templates-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.templates-header p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.templates-grid {
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
  background: #2d2d2d;
  border-radius: 12px;
  border: 2px dashed #3d3d3d;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #ffffff;
}

.empty-state small {
  color: #666;
  font-size: 13px;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.template-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.template-info p {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #999;
}

.template-actions {
  display: flex;
  gap: 10px;
}

.action-bar {
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: #3d3d3d;
  color: #e0e0e0;
}

.btn-secondary:hover {
  background: #4d4d4d;
}

.btn-edit {
  background: #1e88e5;
  color: white;
  flex: 1;
}

.btn-edit:hover {
  background: #1976d2;
}

.btn-danger {
  background: #e53935;
  color: white;
  flex: 1;
}

.btn-danger:hover {
  background: #d32f2f;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2d2d2d;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #3d3d3d;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #3d3d3d;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #ffffff;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: #ffffff;
}

.modal-body {
  padding: 25px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px;
  border-top: 1px solid #3d3d3d;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #b0b0b0;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  font-size: 14px;
  color: #e0e0e0;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
  background: #2a2a2a;
}

.form-control.textarea {
  min-height: 150px;
  resize: vertical;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
}
</style>
