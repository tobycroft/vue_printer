<template>
  <div class="help-container">
    <div class="help-header">
      <img src="/help/cloud.png" alt="Cloud Print" class="help-icon" />
      <h2>云端打印帮助</h2>
      <p>了解如何使用云端打印功能</p>
    </div>

    <div class="help-content">
      <div class="info-card">
        <div class="card-icon">️</div>
        <h3>Cloud Server Work Mode</h3>
        <p>
          如果您需要考虑<strong>团体打印</strong>的需求，可以开启 
          <span class="highlight">Cloud Server Work Mode</span>。
        </p>
        <p class="description">
          该模式允许通过云端服务器进行集中化打印管理，适合多用户、多设备的协作打印场景。
          您可以将打印任务上传到云端，由服务器统一调度和处理。
        </p>
      </div>

      <div class="info-card">
        <div class="card-icon">🔒</div>
        <h3>远程 API 打印服务器</h3>
        <p>
          如果您担心<strong>安全问题</strong>，可以使用本插件的 
          <span class="highlight">远程 API</span> 作为打印服务器。
        </p>
        <p class="description">
          通过部署自己的远程 API 服务，您可以在保证数据安全的前提下，
          实现远程打印功能。所有打印任务都经过您的私有服务器处理，
          不会经过第三方云端服务。
        </p>
      </div>

      <div class="comparison-table">
        <h3>两种模式对比</h3>
        <table>
          <thead>
            <tr>
              <th>特性</th>
              <th>Cloud Server Mode</th>
              <th>远程 API 模式</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>部署难度</td>
              <td>低（使用云端服务）</td>
              <td>中（需要自建服务器）</td>
            </tr>
            <tr>
              <td>数据安全性</td>
              <td>中</td>
              <td>高（数据自控）</td>
            </tr>
            <tr>
              <td>适用场景</td>
              <td>团体打印、协作办公</td>
              <td>对安全要求高的场景</td>
            </tr>
            <tr>
              <td>成本</td>
              <td>按使用量付费</td>
              <td>服务器维护成本</td>
            </tr>
            <tr>
              <td>可扩展性</td>
              <td>高</td>
              <td>取决于服务器配置</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tips-section">
        <h3>💡 使用建议</h3>
        <ul>
          <li>
            <strong>小型团队/个人用户：</strong>建议直接使用 Cloud Server Work Mode，快速上手，无需维护服务器。
          </li>
          <li>
            <strong>中大型企业对数据安全敏感：</strong>建议部署远程 API 打印服务器，数据完全自主控制。
          </li>
          <li>
            <strong>混合使用：</strong>您可以根据不同场景灵活选择两种模式，例如内部文档使用远程 API，外部协作使用云端模式。
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
// 帮助页面组件
</script>

<style scoped>
.help-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.help-header {
  text-align: center;
  padding: 40px;
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  margin-bottom: 30px;
}

.help-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  object-fit: contain;
}

.help-header h2 {
  margin: 0 0 10px 0;
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
}

.help-header p {
  margin: 0;
  font-size: 16px;
  color: #999;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
  transition: all 0.2s;
}

.info-card:hover {
  border-color: #4CAF50;
  box-shadow: 0 4px 16px rgba(76, 175, 80, 0.2);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.info-card p {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.6;
  color: #b0b0b0;
}

.highlight {
  color: #4CAF50;
  font-weight: 600;
  background: rgba(76, 175, 80, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.description {
  font-size: 14px !important;
  color: #999 !important;
  line-height: 1.8 !important;
}

.comparison-table {
  background: #2d2d2d;
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
}

.comparison-table h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #252525;
}

th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #ffffff;
  border-bottom: 2px solid #3d3d3d;
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid #3d3d3d;
  color: #b0b0b0;
}

tbody tr:hover {
  background: #252525;
}

.tips-section {
  background: linear-gradient(135deg, #2d2d2d 0%, #353535 100%);
  border: 1px solid #3d3d3d;
  border-radius: 12px;
  padding: 30px;
}

.tips-section h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.tips-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-section li {
  padding: 12px 0;
  padding-left: 24px;
  position: relative;
  color: #b0b0b0;
  line-height: 1.6;
}

.tips-section li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #4CAF50;
  font-weight: bold;
}

.tips-section li strong {
  color: #ffffff;
}
</style>
