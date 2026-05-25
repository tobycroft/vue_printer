<template>
  <div class="home-container">
    <div class="welcome-card">
      <div class="welcome-icon">️</div>
      <h2>欢迎使用 Vue Printer</h2>
      <p>您的一站式打印管理解决方案</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon"></div>
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
        <div class="stat-icon"></div>
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
          <span class="btn-icon"></span>
          <span>开始打印</span>
        </button>
        <button class="action-btn" @click="handleManageTemplates">
          <span class="btn-icon">📁</span>
          <span>管理模板</span>
        </button>
        <button class="action-btn" @click="handleSettings">
          <span class="btn-icon">️</span>
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
  alert('打印功能开发中...')
}

const handleManageTemplates = () => {
  router.push('/admin/templates')
}

const handleSettings = () => {
  router.push('/admin/settings')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.welcome-card {
  text-align: center;
  padding: 24px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  margin-bottom: 30px;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.welcome-card h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.welcome-card p {
  margin: 0;
  font-size: 14px;
  color: #999;
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
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  transition: all 0.2s;
}

.stat-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
}

.stat-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #b0b0b0;
}

.stat-number {
  margin: 0 0 4px 0;
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.info-section {
  margin-bottom: 30px;
}

.info-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
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
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.action-btn:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 24px;
  margin-right: 10px;
}

.activity-list {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
}

.activity-item {
  padding: 20px;
  border-bottom: 1px solid #3d3d3d;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.activity-item.empty p {
  margin: 0;
}
</style>
