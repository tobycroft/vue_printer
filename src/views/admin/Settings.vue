<template>
  <div class="settings-container">
    <div class="settings-header">
      <h2>打印设置</h2>
      <p>配置您的打印偏好和高级选项</p>
    </div>

    <div class="settings-grid">
      <!-- 基本设置 -->
      <div class="setting-card">
        <div class="card-header">
          <div class="card-icon">⚙️</div>
          <h3>基本设置</h3>
        </div>
        <div class="card-content">
          <div class="form-group">
            <label for="printerName">默认打印机</label>
            <select id="printerName" v-model="settings.printerName" class="form-control">
              <option value="">请选择打印机</option>
              <option value="printer1">打印机 1</option>
              <option value="printer2">打印机 2</option>
              <option value="printer3">打印机 3</option>
            </select>
          </div>

          <div class="form-group">
            <label for="copies">默认打印份数</label>
            <input 
              id="copies" 
              type="number" 
              v-model.number="settings.copies" 
              class="form-control"
              min="1" 
              max="100"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.autoPrint" />
              <span>自动打印</span>
            </label>
            <small>无需确认直接打印</small>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="setting-card">
        <div class="card-header">
          <div class="card-icon">🔧</div>
          <h3>高级设置</h3>
        </div>
        <div class="card-content">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.duplex" />
              <span>双面打印</span>
            </label>
            <small>节省纸张，自动双面打印</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.color" />
              <span>彩色打印</span>
            </label>
            <small>以彩色模式打印文档</small>
          </div>

          <div class="form-group">
            <label for="paperSize">纸张尺寸</label>
            <select id="paperSize" v-model="settings.paperSize" class="form-control">
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
              <option value="Letter">Letter (8.5 × 11 inches)</option>
              <option value="Legal">Legal (8.5 × 14 inches)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 模板设置 -->
      <div class="setting-card">
        <div class="card-header">
          <div class="card-icon">📁</div>
          <h3>模板设置</h3>
        </div>
        <div class="card-content">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.autoSaveTemplates" />
              <span>自动保存模板</span>
            </label>
            <small>自动保存自定义打印模板</small>
          </div>

          <div class="form-group">
            <label for="templatePath">模板保存路径</label>
            <input 
              id="templatePath" 
              type="text" 
              v-model="settings.templatePath" 
              class="form-control"
              placeholder="/templates"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="settings.shareTemplates" />
              <span>共享模板</span>
            </label>
            <small>与其他用户共享自定义模板</small>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="setting-card">
        <div class="card-header">
          <div class="card-icon">ℹ️</div>
          <h3>关于</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span>版本</span>
            <span>1.0.0</span>
          </div>
          <div class="info-item">
            <span>更新日期</span>
            <span>2024-01-01</span>
          </div>
          <div class="info-item">
            <span>开发者</span>
            <span>Vue Printer Team</span>
          </div>
          <div class="info-item">
            <span>引擎</span>
            <span>C-LODOP</span>
          </div>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button class="btn btn-secondary" @click="resetSettings">
        重置为默认值
      </button>
      <button class="btn btn-primary" @click="saveSettings">
        保存设置
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import storageService from '../../services/storageService.js'

const settings = ref({
  printerName: '',
  copies: 1,
  autoPrint: false,
  duplex: false,
  color: true,
  paperSize: 'A4',
  autoSaveTemplates: true,
  templatePath: '/templates',
  shareTemplates: false
})

const defaultSettings = { ...settings.value }

onMounted(async () => {
  const savedSettings = await storageService.get('printSettings')
  if (savedSettings) {
    settings.value = { ...settings.value, ...savedSettings }
  }
})

const saveSettings = async () => {
  try {
    await storageService.set('printSettings', settings.value)
    alert('设置已保存')
  } catch (error) {
    console.error('保存设置失败:', error)
    alert('保存设置失败，请重试')
  }
}

const resetSettings = () => {
  settings.value = { ...defaultSettings }
  alert('设置已重置为默认值')
}
</script>

<style scoped>
.settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.settings-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.settings-header p {
  margin: 0;
  opacity: 0.9;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
}

.setting-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.setting-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-icon {
  font-size: 32px;
  margin-right: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.card-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  width: 16px;
  height: 16px;
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item span:first-child {
  color: #606266;
  font-size: 14px;
}

.info-item span:last-child {
  color: #303133;
  font-weight: 500;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;
  padding-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-secondary {
  background: #f5f7fa;
  color: #606266;
  border: 1px solid #e4e7ed;
}

.btn-secondary:hover {
  background: #e9ecef;
}
</style>