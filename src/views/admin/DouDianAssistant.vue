<template>
  <div class="doudian-container">
    <div class="header-section">
      <h2>🏪 抖店助手</h2>
      <p>连接抖音电商，获取订单数据</p>
    </div>

    <div class="status-card">
      <div class="status-item">
        <span class="status-label">登录状态：</span>
        <span :class="['status-value', loginStatus.isLoggedIn ? 'success' : 'error']">
          {{ loginStatus.isLoggedIn ? '已登录' : '未登录' }}
        </span>
        <span v-if="loginStatus.isLoggedIn" class="cookie-count">
          ({{ loginStatus.cookieCount }} 个 Cookie)
        </span>
      </div>
      <div v-if="!loginStatus.isLoggedIn" class="login-tip">
        <p>⚠️ 请先访问 <a href="https://fxg.jinritemai.com" target="_blank">fxg.jinritemai.com</a> 登录抖音电商</p>
      </div>
    </div>

    <div class="action-section">
      <button 
        class="btn-fetch" 
        @click="fetchOrders"
        :disabled="loading || !loginStatus.isLoggedIn"
      >
        <span v-if="loading" class="loading-spinner">⟳</span>
        {{ loading ? '获取中...' : '获取订单数据' }}
      </button>
      <button 
        class="btn-refresh" 
        @click="checkLoginStatus"
        :disabled="checking"
      >
        {{ checking ? '检查中...' : '刷新登录状态' }}
      </button>
    </div>

    <div class="data-section" v-if="orders.length > 0">
      <div class="data-header">
        <h3>📋 订单列表</h3>
        <span class="data-count">共 {{ orders.length }} 条</span>
      </div>
      
      <div class="order-list">
        <div 
          v-for="(order, index) in orders" 
          :key="order.shop_order_id || index"
          class="order-card"
        >
          <div class="order-card-header">
            <div class="order-id-section">
              <span class="order-id-label">订单号</span>
              <span class="order-id-value">{{ order.shop_order_id || '-' }}</span>
            </div>
            <div class="order-status-section">
              <span :class="['status-badge', getStatusClass(order.order_status)]">
                {{ order.order_status_info?.order_status_text || getStatusText(order.order_status) }}
              </span>
              <span class="pay-type">{{ order.pay_type_desc || '-' }}</span>
            </div>
          </div>

          <div class="order-card-body">
            <!-- 商品信息 -->
            <div class="product-section" v-if="order.product_item && order.product_item.length > 0">
              <div 
                v-for="(product, pIndex) in order.product_item" 
                :key="pIndex"
                class="product-item"
              >
                <img 
                  v-if="product.img" 
                  :src="product.img" 
                  class="product-image"
                  alt="商品图片"
                />
                <div class="product-info">
                  <h4 class="product-name">{{ product.product_name || '-' }}</h4>
                  <div class="product-specs">
                    <span 
                      v-for="(spec, sIndex) in product.sku_spec" 
                      :key="sIndex"
                      class="spec-tag"
                    >
                      {{ spec.name }}: {{ spec.value }}
                    </span>
                  </div>
                  <div class="product-price">
                    <span class="price">¥{{ formatAmount(product.pay_amount) }}</span>
                    <span class="quantity">x{{ product.combo_num || 1 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 买家信息 -->
            <div class="buyer-section" v-if="order.receiver_info">
              <div class="section-title">👤 买家信息</div>
              <div class="buyer-info">
                <p><strong>昵称:</strong> {{ order.user_nickname || '-' }}</p>
                <p><strong>收货人:</strong> {{ order.receiver_info.post_receiver || '-' }}</p>
                <p><strong>电话:</strong> {{ order.receiver_info.post_tel || '-' }}</p>
                <p v-if="order.receiver_info.post_addr">
                  <strong>地址:</strong> 
                  {{ order.receiver_info.post_addr.province?.name || '' }}
                  {{ order.receiver_info.post_addr.city?.name || '' }}
                  {{ order.receiver_info.post_addr.town?.name || '' }}
                  {{ order.receiver_info.post_addr.detail || '' }}
                </p>
              </div>
            </div>

            <!-- 订单金额 -->
            <div class="amount-section">
              <div class="section-title">💰 订单金额</div>
              <div class="amount-info">
                <div class="amount-row">
                  <span>商品总额:</span>
                  <span>¥{{ formatAmount(order.pay_amount) }}</span>
                </div>
                <div class="amount-row">
                  <span>运费:</span>
                  <span>¥{{ formatAmount(order.post_amount) }}</span>
                </div>
                <div class="amount-row total">
                  <span>实付金额:</span>
                  <span class="total-amount">¥{{ formatAmount(order.actual_pay_amount) }}</span>
                </div>
                <div class="amount-row">
                  <span>商家收入:</span>
                  <span class="receive-amount">{{ order.actual_receive_amount || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- 订单时间 -->
            <div class="time-section">
              <div class="section-title">📅 订单时间</div>
              <div class="time-info">
                <p><strong>下单时间:</strong> {{ formatTime(order.create_time) }}</p>
                <p><strong>付款时间:</strong> {{ formatTime(order.pay_time) }}</p>
                <p v-if="order.exp_ship_time">
                  <strong>发货截止:</strong> {{ formatTime(order.exp_ship_time) }}
                </p>
              </div>
            </div>

            <!-- 状态备注 -->
            <div class="remark-section" v-if="order.order_status_info?.order_status_remark">
              <div class="section-title">📝 状态备注</div>
              <p class="status-remark">{{ order.order_status_info.order_status_remark }}</p>
            </div>

            <!-- 商品标签 -->
            <div class="tags-section" v-if="order.product_item && order.product_item[0]?.tags">
              <div class="section-title">🏷️ 商品标签</div>
              <div class="tag-list">
                <span 
                  v-for="(tag, tIndex) in order.product_item[0].tags" 
                  :key="tIndex"
                  :class="['tag', tag.tag_type || 'default']"
                >
                  {{ tag.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading && hasFetched">
      <div class="empty-icon">📭</div>
      <p>暂无订单数据</p>
      <p class="empty-tip">点击"获取订单数据"按钮获取最新订单</p>
    </div>

    <div class="error-message" v-if="error">
      <p>❌ {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import jinriApiService from '@/services/jinriApiService'

const loading = ref(false)
const checking = ref(false)
const hasFetched = ref(false)
const loginStatus = ref({
  isLoggedIn: false,
  cookieCount: 0
})
const orders = ref([])
const error = ref('')

// 检查登录状态
const checkLoginStatus = async () => {
  checking.value = true
  error.value = ''
  
  try {
    const result = await jinriApiService.checkLogin()
    if (result.success) {
      loginStatus.value = {
        isLoggedIn: result.isLoggedIn,
        cookieCount: result.cookieCount
      }
    } else {
      error.value = result.error || '检查登录状态失败'
    }
  } catch (err) {
    error.value = '检查登录状态出错: ' + err.message
  } finally {
    checking.value = false
  }
}

// 获取订单数据
const fetchOrders = async () => {
  if (!loginStatus.value.isLoggedIn) {
    error.value = '请先登录抖音电商'
    return
  }

  loading.value = true
  error.value = ''
  hasFetched.value = true

  try {
    const result = await jinriApiService.getOrderList({
      page: 0,
      pageSize: 20,
      tab: 'all'
    })

    if (result.success) {
      // 检查是否登录失效
      if (result.data && result.data.code === '10008') {
        error.value = '🔒 ' + (result.data.msg || '登录信息已失效，请重新登录')
        loginStatus.value.isLoggedIn = false
        orders.value = []
        return
      }
      
      // 解析订单数据 - API 返回结构: { data: [订单数组] }
      let orderData = []
      
      console.log('API 返回数据:', result.data)
      
      if (typeof result.data === 'object' && result.data !== null) {
        // 直接取 data 数组
        if (Array.isArray(result.data)) {
          orderData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          orderData = result.data.data
        } else if (result.data.list && Array.isArray(result.data.list)) {
          orderData = result.data.list
        } else if (result.data.orders && Array.isArray(result.data.orders)) {
          orderData = result.data.orders
        }
      }

      orders.value = orderData
      console.log('解析后的订单数据:', orderData)
      
      if (orderData.length === 0) {
        console.log('未找到订单数据，API 返回:', result.data)
      }
    } else {
      error.value = result.error || '获取订单失败'
      orders.value = []
    }
  } catch (err) {
    error.value = '获取订单出错: ' + err.message
    orders.value = []
  } finally {
    loading.value = false
  }
}

// 格式化金额（分转元）
const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0.00'
  return (amount / 100).toFixed(2)
}

// 格式化时间戳
const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  
  // 处理秒级时间戳
  if (typeof timestamp === 'number') {
    // 判断是秒还是毫秒
    const ts = timestamp > 10000000000 ? timestamp : timestamp * 1000
    return new Date(ts).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
  
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取状态样式类
const getStatusClass = (status) => {
  const statusMap = {
    1: 'pending',      // 待支付
    2: 'pending',      // 待发货
    3: 'shipped',      // 已发货
    4: 'completed',    // 已完成
    5: 'cancelled',    // 已取消
    6: 'cancelled',    // 已关闭
    7: 'pending',      // 待成团
    8: 'pending',      // 待预约
    21: 'pending',     // 发货中
    22: 'shipped',     // 部分发货
    29: 'completed',   // 货到付款已收货
    101: 'cancelled',  // 已取消
    105: 'cancelled'   // 已关闭
  }
  return statusMap[status] || 'unknown'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '待支付',
    2: '待发货',
    3: '已发货',
    4: '已完成',
    5: '已取消',
    6: '已关闭',
    7: '待成团',
    8: '待预约',
    21: '发货中',
    22: '部分发货',
    29: '货到付款已收货',
    101: '已取消',
    105: '已关闭'
  }
  return statusMap[status] || '未知状态'
}

// 页面加载时检查登录状态
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
  color: #333;
  font-size: 24px;
}

.header-section p {
  margin: 0;
  color: #666;
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
}

.btn-fetch,
.btn-refresh {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-fetch {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}

.btn-fetch:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049 0%, #388E3C 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-fetch:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-refresh {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-refresh:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.data-header h3 {
  margin: 0;
  color: #333;
}

.data-count {
  color: #666;
  font-size: 14px;
}

.order-list {
  max-height: 800px;
  overflow-y: auto;
}

.order-card {
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.order-card:hover {
  background: #f9f9f9;
}

.order-card:last-child {
  border-bottom: none;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e0e0e0;
}

.order-id-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-id-label {
  font-size: 12px;
  color: #999;
}

.order-id-value {
  font-weight: 600;
  color: #333;
  font-family: monospace;
  font-size: 14px;
}

.order-status-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #E65100;
}

.status-badge.shipped {
  background: #E3F2FD;
  color: #1565C0;
}

.status-badge.completed {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.cancelled {
  background: #FFEBEE;
  color: #C62828;
}

.status-badge.unknown {
  background: #F5F5F5;
  color: #666;
}

.pay-type {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

.order-card-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.section-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

/* 商品信息 */
.product-section {
  grid-column: 1 / -1;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
}

.product-name {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
  line-height: 1.4;
}

.product-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.spec-tag {
  font-size: 12px;
  color: #666;
  background: #e8e8e8;
  padding: 2px 8px;
  border-radius: 4px;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price {
  font-weight: 600;
  color: #f44336;
  font-size: 16px;
}

.quantity {
  color: #999;
  font-size: 13px;
}

/* 买家信息 */
.buyer-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.buyer-info p {
  margin: 4px 0;
  color: #555;
  font-size: 13px;
}

/* 金额信息 */
.amount-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 13px;
  color: #555;
}

.amount-row.total {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ddd;
  font-weight: 600;
}

.total-amount {
  color: #f44336;
  font-size: 16px;
}

.receive-amount {
  color: #4CAF50;
  font-weight: 600;
}

/* 时间信息 */
.time-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.time-info p {
  margin: 4px 0;
  color: #555;
  font-size: 13px;
}

/* 备注 */
.remark-section {
  background: #FFF8E1;
  padding: 12px;
  border-radius: 8px;
}

.status-remark {
  margin: 0;
  color: #E65100;
  font-size: 13px;
}

/* 标签 */
.tags-section {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
}

.tag.transparent_grey {
  background: #e0e0e0;
  color: #666;
}

.tag.default {
  background: #e0e0e0;
  color: #666;
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
</style>