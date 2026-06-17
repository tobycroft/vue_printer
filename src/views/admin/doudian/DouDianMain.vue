<template>
  <div class="doudian-container">
    <div class="header-section">
      <h2>🏪 抖店助手</h2>
      <p>连接抖音电商，获取订单数据</p>
    </div>

    <div class="status-card">
      <div class="status-item">
        <span class="status-label">登录状态：</span>
        <span v-if="checking" class="status-value checking">
          <span class="loading-spinner-inline">⟳</span> 验证中...
        </span>
        <span v-else :class="['status-value', loginStatus.isLoggedIn ? 'success' : 'error']">
          {{ loginStatus.isLoggedIn ? '已登录' : '未登录' }}
        </span>
        <span v-if="loginStatus.isLoggedIn && !checking" class="cookie-count">
          ({{ loginStatus.cookieCount }} 个 Cookie)
        </span>
      </div>
      <div v-if="debugInfo.code !== null" class="debug-info">
        <small>接口返回: code={{ debugInfo.code }}, msg={{ debugInfo.msg || '无' }}</small>
      </div>
      <div v-if="!loginStatus.isLoggedIn && !checking" class="login-tip">
        <p>⚠️ 请先访问 <a href="https://fxg.jinritemai.com" target="_blank">fxg.jinritemai.com</a> 登录抖音电商</p>
      </div>
    </div>

    <div class="action-section">
      <button
        class="btn-tab"
        :class="activeTab === 'all' ? 'active' : ''"
        @click="fetchOrders('all')"
        :disabled="loading || !loginStatus.isLoggedIn"
      >
        <span v-if="loading && activeTab === 'all'" class="loading-spinner">⟳</span>
        {{ loading && activeTab === 'all' ? '获取中...' : '📋 全部订单' }}
      </button>
      <button
        class="btn-tab btn-warn"
        :class="activeTab === 'stock_up' ? 'active' : ''"
        @click="fetchOrders('stock_up')"
        :disabled="loading || !loginStatus.isLoggedIn"
      >
        <span v-if="loading && activeTab === 'stock_up'" class="loading-spinner">⟳</span>
        {{ loading && activeTab === 'stock_up' ? '获取中...' : '📦 等待发货' }}
      </button>
      <button
        class="btn-tab btn-info"
        :class="activeTab === 'on_delivery' ? 'active' : ''"
        @click="fetchOrders('on_delivery')"
        :disabled="loading || !loginStatus.isLoggedIn"
      >
        <span v-if="loading && activeTab === 'on_delivery'" class="loading-spinner">⟳</span>
        {{ loading && activeTab === 'on_delivery' ? '获取中...' : '🚚 已发货' }}
      </button>
      <button
        class="btn-tab btn-danger"
        :class="activeTab === 'unpaid' ? 'active' : ''"
        @click="fetchOrders('unpaid')"
        :disabled="loading || !loginStatus.isLoggedIn"
      >
        <span v-if="loading && activeTab === 'unpaid'" class="loading-spinner">⟳</span>
        {{ loading && activeTab === 'unpaid' ? '获取中...' : '💰 待支付' }}
      </button>
      <button
        class="btn-refresh"
        @click="checkLoginStatus"
        :disabled="checking"
      >
        {{ checking ? '检查中...' : '🔄 刷新登录' }}
      </button>
    </div>

    <div class="data-section" v-if="orders.length > 0 || (hasFetched && activeTab)">
      <div class="data-header">
        <h3>{{ tabTitle }}</h3>
        <div class="data-summary">
          <span v-if="totalCount > 0">共 <strong>{{ totalCount }}</strong> 条</span>
          <span v-if="totalCount > 0" class="summary-sep"> | </span>
          <span>第 <strong>{{ humanCurrentPage }}</strong> / {{ totalPages }} 页</span>
          <span class="summary-sep"> | </span>
          <span>本页 {{ orders.length }} 条</span>
        </div>
      </div>

      <PaginationBar
        v-if="totalCount > currentSize"
        :current-page="humanCurrentPage"
        :total-pages="totalPages"
        :page-size="currentSize"
        :has-prev="hasPrevPage"
        :has-next="hasNextPage"
        :loading="loading"
        @prev="prevPage"
        @next="nextPage"
        @sizeChange="changePageSize"
        @goto="handleGoto"
      />

      <div class="order-list">
        <OrderCard
          v-for="(order, index) in orders"
          :key="order.shop_order_id || index"
          :order="order"
          :status-class="getStatusClass(order.order_status)"
          :status-text="getStatusText(order.order_status)"
          @copy="copyText"
        />
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading && hasFetched">
      <div class="empty-icon">📭</div>
      <p>暂无订单数据</p>
      <p class="empty-tip">点击上方按钮获取最新订单</p>
    </div>

    <div class="error-message" v-if="error">
      <p>❌ {{ error }}</p>
    </div>

    <div class="raw-data-section" v-if="rawApiResponse">
      <div class="raw-data-header" @click="showRawData = !showRawData">
        <h3>🔍 完整原始数据（用于分析可用字段）</h3>
        <span class="toggle-arrow">{{ showRawData ? '▼' : '▶' }}</span>
      </div>
      <div v-if="showRawData" class="raw-data-body">
        <div class="raw-top-level">
          <h4>顶层结构：</h4>
          <pre>{{ rawTopLevelKeys }}</pre>
        </div>
        <div class="raw-sample">
          <h4>第 1 条订单的所有字段（示例）：</h4>
          <pre>{{ rawSampleOrder }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDouDian } from './useDouDian'
import OrderCard from './OrderCard.vue'
import PaginationBar from './PaginationBar.vue'

const {
  loading,
  checking,
  hasFetched,
  activeTab,
  loginStatus,
  debugInfo,
  orders,
  error,
  currentSize,
  totalCount,
  rawApiResponse,
  showRawData,
  totalPages,
  humanCurrentPage,
  hasPrevPage,
  hasNextPage,
  tabTitle,
  rawTopLevelKeys,
  rawSampleOrder,
  gotoPageInput,
  checkLoginStatus,
  fetchOrders,
  prevPage,
  nextPage,
  gotoPage,
  changePageSize,
  getStatusClass,
  getStatusText,
  copyText
} = useDouDian()

const handleGoto = (val) => {
  gotoPageInput.value = val
  gotoPage()
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.doudian-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 24px;
}

.header-section h2 {
  margin: 0 0 8px 0;
  color: #ffffff;
  font-size: 26px;
  font-weight: 700;
}

.header-section p {
  margin: 0;
  color: #cccccc;
  font-size: 14px;
}

.status-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-label {
  font-weight: 500;
  color: #333;
}

.status-value {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

.status-value.success {
  color: #4CAF50;
  background: #E8F5E9;
}

.status-value.error {
  color: #f44336;
  background: #FFEBEE;
}

.status-value.checking {
  color: #FF9800;
  background: #FFF3E0;
}

.loading-spinner-inline {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.debug-info {
  margin-top: 8px;
  color: #888;
  font-size: 12px;
}

.cookie-count {
  color: #666;
  font-size: 14px;
}

.login-tip {
  margin-top: 12px;
  padding: 12px;
  background: #FFF3E0;
  border-radius: 6px;
  border-left: 4px solid #FF9800;
}

.login-tip p {
  margin: 0;
  color: #E65100;
}

.login-tip a {
  color: #1976D2;
  text-decoration: none;
}

.login-tip a:hover {
  text-decoration: underline;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-tab,
.btn-refresh {
  padding: 12px 24px;
  border: 2px solid #E0E0E0;
  background: #FAFAFA;
  color: #555;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-tab:hover:not(:disabled) {
  background: #F5F5F5;
  border-color: #BDBDBD;
  transform: translateY(-1px);
}

.btn-tab:disabled,
.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-tab.active {
  background: #1976D2;
  border-color: #1976D2;
  color: #fff;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.25);
}

.btn-tab.btn-warn {
  border-color: #FFE0B2;
}
.btn-tab.btn-warn.active {
  background: #F57C00;
  border-color: #F57C00;
  box-shadow: 0 4px 12px rgba(245, 124, 0, 0.25);
}

.btn-tab.btn-info {
  border-color: #B3E5FC;
}
.btn-tab.btn-info.active {
  background: #0288D1;
  border-color: #0288D1;
  box-shadow: 0 4px 12px rgba(2, 136, 209, 0.25);
}

.btn-tab.btn-danger {
  border-color: #FFCDD2;
}
.btn-tab.btn-danger.active {
  background: #C62828;
  border-color: #C62828;
  box-shadow: 0 4px 12px rgba(198, 40, 40, 0.25);
}

.btn-refresh:hover:not(:disabled) {
  background: #e0e0e0;
}

.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.data-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 8px;
}

.data-header h3 {
  margin: 0;
  color: #333;
}

.data-summary {
  color: #666;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.data-summary strong {
  color: #1976D2;
  font-weight: 600;
  margin: 0 2px;
}

.summary-sep {
  color: #ccc;
  margin: 0 4px;
}

.order-list {
  max-height: 800px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 14px;
  margin-top: 8px;
}

.error-message {
  padding: 16px;
  background: #FFEBEE;
  border-radius: 6px;
  border-left: 4px solid #f44336;
  margin-top: 20px;
}

.error-message p {
  margin: 0;
  color: #C62828;
}

.raw-data-section {
  margin-top: 24px;
  background: #FAFAFA;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
  overflow: hidden;
}

.raw-data-header {
  padding: 12px 20px;
  background: #ECEFF1;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.raw-data-header h3 {
  margin: 0;
  color: #37474F;
  font-size: 14px;
}

.toggle-arrow {
  color: #78909C;
  font-size: 12px;
}

.raw-data-body {
  padding: 16px 20px;
}

.raw-data-body h4 {
  margin: 0 0 8px 0;
  color: #546E7A;
  font-size: 13px;
  font-weight: 600;
}

.raw-data-body pre {
  margin: 0 0 16px 0;
  padding: 12px;
  background: #263238;
  color: #ECEFF1;
  border-radius: 6px;
  font-size: 12px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 500px;
  overflow: auto;
}

.raw-data-body pre:last-child {
  margin-bottom: 0;
}
</style>
