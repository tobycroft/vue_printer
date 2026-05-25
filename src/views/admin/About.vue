<template>
  <div class="about-container">
    <div class="about-header">
      <h2>关于</h2>
      <p>了解 Vue Printer 扩展信息</p>
    </div>

    <div class="about-card">
      <div class="logo-section">
        <div class="logo-icon">️</div>
        <h1>Vue Printer</h1>
        <p class="version">v1.0.0</p>
      </div>

      <div class="info-section">
        <h3>版本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">当前版本</span>
            <span class="value">1.0.0</span>
          </div>
          <div class="info-item">
            <span class="label">更新日期</span>
            <span class="value">2024-01-01</span>
          </div>
          <div class="info-item">
            <span class="label">许可证</span>
            <span class="value">MIT License</span>
          </div>
          <div class="info-item">
            <span class="label">打印引擎</span>
            <span class="value">C-LODOP</span>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>项目介绍</h3>
        <p class="description">
          Vue Printer 是一款基于 Vue 3 开发的浏览器打印扩展，旨在为直播拆卡等小众主播提供低成本、高可用的打单解决方案。
        </p>
      </div>

      <div class="info-section">
        <h3>核心功能</h3>
        <ul class="feature-list">
          <li>📄 支持自定义打印模板</li>
          <li>🖨️ 连接打单机，整合订单数据并发送打印</li>
          <li> 支持单份/双份打印，同订单多格式并发输出</li>
          <li>🔄 双协议保底机制保障网络恢复后自动补打</li>
          <li>👥 支持子账号隔离数据</li>
        </ul>
      </div>

      <div class="info-section">
        <h3>技术栈</h3>
        <div class="tech-tags">
          <span class="tag">Vue 3</span>
          <span class="tag">Vite</span>
          <span class="tag">Chrome Extension</span>
          <span class="tag">Manifest V3</span>
          <span class="tag">C-LODOP</span>
        </div>
      </div>

      <div class="info-section">
        <h3>开源协议</h3>
        <p class="license">
          本项目采用 MIT 开源协议，允许自由使用、修改和分发。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// 关于页面不需要特殊逻辑
</script>

<style scoped>
.about-container {
  max-width: 800px;
  margin: 0 auto;
}

.about-header {
  margin-bottom: 30px;
}

.about-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.about-header p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.about-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 40px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #3d3d3d;
}

.logo-icon {
  font-size: 72px;
  margin-bottom: 15px;
}

.logo-section h1 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
}

.version {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.info-section {
  margin-bottom: 30px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #252525;
  border-radius: 8px;
  border: 1px solid #3d3d3d;
}

.info-item .label {
  color: #b0b0b0;
  font-size: 14px;
}

.info-item .value {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
}

.description {
  margin: 0;
  color: #b0b0b0;
  font-size: 14px;
  line-height: 1.8;
}

.feature-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.feature-list li {
  margin-bottom: 12px;
  color: #b0b0b0;
  font-size: 14px;
  line-height: 1.6;
}

.feature-list li:last-child {
  margin-bottom: 0;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 8px 16px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 20px;
  color: #b0b0b0;
  font-size: 13px;
  font-weight: 500;
}

.license {
  margin: 0;
  color: #b0b0b0;
  font-size: 14px;
  line-height: 1.8;
}
</style>
