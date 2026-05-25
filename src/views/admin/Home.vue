<template>
  <div class="home-container">
    <div class="welcome-card">
      <div class="welcome-icon">🖨️</div>
      <h2>欢迎使用 Vue Printer</h2>
      <p>您的一站式打印管理解决方案</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>打印任务</h3>
          <p class="stat-number">0</p>
          <span class="stat-label">今日已完成</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <h3>打印速度</h3>
          <p class="stat-number">快</p>
          <span class="stat-label">当前状态</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <h3>模板数量</h3>
          <p class="stat-number">0</p>
          <span class="stat-label">可用模板</span>
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>快速操作</h3>
      <div class="quick-actions">
        <button class="action-btn" @click="handlePrint">
          <span class="btn-icon">🖨️</span>
          <span>开始打印</span>
        </button>
        <button class="action-btn" @click="handleManageTemplates">
          <span class="btn-icon">📁</span>
          <span>管理模板</span>
        </button>
        <button class="action-btn" @click="handleSettings">
          <span class="btn-icon">⚙️</span>
          <span>打印设置</span>
        </button>
      </div>
    </div>

    <div class="info-section">
      <h3>最近活动</h3>
      <div class="activity-list">
        <div class="activity-item empty">
          <p>暂无打印活动记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handlePrint = () => {
  // 实现打印逻辑
  alert('打印功能开发中...')
}

const handleManageTemplates = () => {
  // 实现模板管理逻辑
  alert('模板管理功能开发中...')
}

const handleSettings = () => {
  router.push('/admin/settings')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100%;
}

.welcome-card {
  text-align: center;
  padding: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.welcome-card h2 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: 600;
}

.welcome-card p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
}

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.stat-number {
  margin: 0 0 4px 0;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.info-section {
  margin-bottom: 30px;
}

.info-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  width: 100%;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: #f8f9fa;
}

.btn-icon {
  font-size: 24px;
  margin-right: 10px;
}

.activity-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.activity-item {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item.empty {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.activity-item.empty p {
  margin: 0;
}
</style>