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
      <!-- 调试信息：显示接口返回的原始 code 和 msg -->
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

      <div class="pagination-bar" v-if="totalCount > currentSize">
        <button 
          class="page-btn"
          @click="prevPage"
          :disabled="!hasPrevPage || loading"
        >◀ 上一页</button>

        <span class="page-info">第 {{ humanCurrentPage }} / {{ totalPages }} 页</span>

        <button 
          class="page-btn"
          @click="nextPage"
          :disabled="!hasNextPage || loading"
        >下一页 ▶</button>

        <span class="page-sep">|</span>

        <select 
          class="page-size"
          :value="String(currentSize)"
          @change="changePageSize(($event.target || {}).value)"
          :disabled="loading"
        >
          <option value="10">每页 10 条</option>
          <option value="20">每页 20 条</option>
          <option value="30">每页 30 条</option>
          <option value="50">每页 50 条</option>
        </select>

        <span class="page-sep">|</span>

        <input 
          type="number"
          min="1"
          :max="totalPages"
          class="page-input"
          v-model="gotoPageInput"
          placeholder="跳转到"
          :disabled="loading"
          @keydown.enter="gotoPage"
        />
        <button 
          class="page-btn small"
          @click="gotoPage"
          :disabled="loading"
        >跳转</button>
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
              <button 
                class="btn-copy" 
                @click="copyText(order.shop_order_id)"
                :title="'复制订单号'"
              >复制</button>
              <span class="meta-tag" v-if="order.product_count">共 {{ order.product_count }} 件</span>
            </div>
            <div class="order-status-section">
              <span :class="['status-badge', getStatusClass(order.order_status)]">
                {{ order.order_status_info?.order_status_text || getStatusText(order.order_status) }}
              </span>
              <span class="pay-type">{{ order.pay_type_desc || '-' }}</span>
            </div>
          </div>

          <div class="order-card-body">
            <!-- 买家留言/卖家备注 -->
            <div class="remarks-section" v-if="order.buyer_words || order.remark">
              <div v-if="order.buyer_words" class="remark-item buyer-remark">
                <span class="remark-label">💬 买家留言:</span>
                <span class="remark-text">{{ order.buyer_words }}</span>
              </div>
              <div v-if="order.remark" class="remark-item seller-remark">
                <span class="remark-label">📝 卖家备注:</span>
                <span class="remark-text">{{ order.remark }}</span>
              </div>
            </div>

            <!-- 商品信息 -->
            <div class="product-section" v-if="order.product_item && order.product_item.length > 0">
              <div class="section-title">🎁 商品信息</div>
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
              <div class="section-title">👤 收货信息</div>
              <div class="buyer-info">
                <p><strong>买家昵称:</strong> {{ order.user_nickname || '-' }}</p>
                <p><strong>收货人:</strong> {{ order.receiver_info.post_receiver || '-' }}</p>
                <p><strong>电话:</strong> {{ order.receiver_info.post_tel || '-' }}</p>
                <p v-if="order.receiver_info.post_addr">
                  <strong>地址:</strong>
                  {{ order.receiver_info.post_addr.province?.name || '' }}
                  {{ order.receiver_info.post_addr.city?.name || '' }}
                  {{ order.receiver_info.post_addr.town?.name || '' }}
                  {{ order.receiver_info.post_addr.street?.name || '' }}
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
              <div class="section-title">⏰ 状态备注</div>
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
      <p class="empty-tip">点击上方按钮获取最新订单</p>
    </div>

    <div class="error-message" v-if="error">
      <p>❌ {{ error }}</p>
    </div>

    <!-- 原始数据查看面板 -->
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
import { ref, computed, onMounted } from 'vue'
import jinriApiService from '@/services/jinriApiService'

const loading = ref(false)
const checking = ref(false)
const hasFetched = ref(false)
const activeTab = ref('')
const loginStatus = ref({
  isLoggedIn: false,
  cookieCount: 0
})
const debugInfo = ref({
  code: null,
  msg: null
})
const orders = ref([])
const error = ref('')

// 分页相关状态
const currentPage = ref(0)        // 当前页码（0-based，与后端对齐）
const currentSize = ref(10)       // 当前每页条数
const totalCount = ref(0)         // 总条数
const gotoPageInput = ref('')     // 跳转输入框（1-based 人类可读）

// 原始数据查看
const rawApiResponse = ref(null)
const showRawData = ref(false)

// 分页计算（1-based 展示）
const totalPages = computed(() => {
  const size = currentSize.value || 1
  return Math.max(1, Math.ceil(totalCount.value / size))
})
const humanCurrentPage = computed(() => currentPage.value + 1)
const hasPrevPage = computed(() => currentPage.value > 0)
const hasNextPage = computed(() => currentPage.value + 1 < totalPages.value)

// Tab 对应的显示标题
const tabTitle = computed(() => {
  const map = {
    'all': '📋 全部订单',
    'stock_up': '📦 等待发货',
    'on_delivery': '🚚 已发货',
    'unpaid': '💰 待支付'
  }
  return map[activeTab.value] || '📋 订单列表'
})

// 复制文本
const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    // 兜底方案：创建临时 textarea
    const tempEl = document.createElement('textarea')
    tempEl.value = text
    document.body.appendChild(tempEl)
    tempEl.select()
    try {
      document.execCommand('copy')
    } catch (_) { /* ignore */ }
    document.body.removeChild(tempEl)
  }
}

// 从原始响应中提取顶层字段，看看有没有 total、current_page 等可用信息
const rawTopLevelKeys = computed(() => {
  if (!rawApiResponse.value) return '(暂无)'
  try {
    const data = rawApiResponse.value
    const keys = Object.keys(data)
    const summary = {}
    for (const k of keys) {
      const v = data[k]
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        summary[k] = `{ ${Object.keys(v).slice(0, 10).join(', ')}${Object.keys(v).length > 10 ? '...' : ''} }`
      } else if (Array.isArray(v)) {
        summary[k] = `Array[${v.length}]`
      } else {
        summary[k] = v
      }
    }
    return JSON.stringify(summary, null, 2)
  } catch (e) {
    return String(rawApiResponse.value)
  }
})

// 提取第一条订单的所有字段，用于分析
const rawSampleOrder = computed(() => {
  if (!orders.value || orders.value.length === 0) return '(暂无订单数据)'
  try {
    return JSON.stringify(orders.value[0], (key, val) => {
      if (typeof val === 'string' && val.length > 200) return val.slice(0, 200) + '...(截断)'
      return val
    }, 2)
  } catch (e) {
    return String(orders.value[0])
  }
})

// 检查登录状态
// 注意：不能仅通过 Cookie 是否存在来判断，Cookie 可能已过期
// 后端会通过实际调用接口验证 Cookie 的有效性
const checkLoginStatus = async () => {
  checking.value = true
  error.value = ''
  // 重置调试信息
  debugInfo.value = { code: null, msg: null }

  try {
    const result = await jinriApiService.checkLogin()
    console.log('[抖店助手] checkLogin 返回:', result)

    if (result.success) {
      loginStatus.value = {
        isLoggedIn: result.isLoggedIn,
        cookieCount: result.cookieCount
      }
      // 记录调试信息
      debugInfo.value = {
        code: result.code ?? null,
        msg: result.msg ?? null
      }
      // 如果后端返回了具体的错误信息（如 Cookie 过期），显示出来
      if (!result.isLoggedIn && result.msg) {
        error.value = '🔒 ' + result.msg
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
// @param opts - 选项对象
// @param opts.tab - 订单类型：'all' | 'stock_up' | 'on_delivery' | 'unpaid'
// @param opts.page - 当前页码（0-based）
// @param opts.pageSize - 每页条数
const fetchOrders = async (opts = {}) => {
  const tab = typeof opts === 'string' ? opts : (opts.tab || 'all')
  const page = typeof opts === 'string' ? 0 : (opts.page ?? currentPage.value)
  const pageSize = typeof opts === 'string' ? currentSize.value : (opts.pageSize ?? currentSize.value)

  // 再次检查登录状态，防止 Cookie 在检查后被清理或过期
  await checkLoginStatus()

  if (!loginStatus.value.isLoggedIn) {
    error.value = '请先登录抖音电商'
    return
  }

  activeTab.value = tab
  currentPage.value = page
  currentSize.value = pageSize
  loading.value = true
  error.value = ''
  hasFetched.value = true

  try {
    const result = await jinriApiService.getOrderList({
      page: page,
      pageSize: pageSize,
      tab: tab
    })

    if (result.success) {
      // 检查是否登录失效（双重保险）
      if (result.data && result.data.code === '10008') {
        error.value = '🔒 ' + (result.data.msg || '登录信息已失效，请重新登录')
        loginStatus.value.isLoggedIn = false
        orders.value = []
        return
      }

      // 解析订单数据 - API 返回结构: { code: 0, data: [订单数组], total, page, size, ... }
      let orderData = []

      console.log(`[抖店助手][${tab}][page=${page}] API 返回数据:`, result.data)

      if (result.data && typeof result.data === 'object') {
        if (Array.isArray(result.data)) {
          orderData = result.data
        } else if (result.data.data && Array.isArray(result.data.data)) {
          orderData = result.data.data
        } else if (result.data.list && Array.isArray(result.data.list)) {
          orderData = result.data.list
        } else if (result.data.orders && Array.isArray(result.data.orders)) {
          orderData = result.data.orders
        }

        // 解析分页字段：total / size / page
        // 优先从外层（result.data 上的字段）取，其次从内层（result.data 下的字段）取
        const src = result.data
        const inner = (typeof src === 'object' && src !== null && !Array.isArray(src)) ? src : null

        const totalRaw = inner ? (src.total ?? src.total_count ?? src.totalCount ?? (src.data && (src.data.total ?? src.data.total_count ?? src.data.totalCount))) : null
        const sizeRaw = inner ? (src.size ?? src.pageSize ?? src.page_size ?? (src.data && (src.data.size ?? src.data.pageSize ?? src.data.page_size))) : null
        const pageRaw = inner ? (src.page ?? (src.data && src.data.page)) : null

        if (totalRaw !== undefined && totalRaw !== null) {
          totalCount.value = Number(totalRaw) || 0
        } else {
          totalCount.value = orderData.length
        }
        if (sizeRaw !== undefined && sizeRaw !== null) {
          currentSize.value = Number(sizeRaw) || pageSize
        }
        if (pageRaw !== undefined && pageRaw !== null) {
          const p = Number(pageRaw)
          currentPage.value = Number.isFinite(p) ? p : page
        }
      }

      orders.value = orderData
      rawApiResponse.value = result.data
      console.log(`[抖店助手][${tab}] 解析: total=${totalCount.value}, page=${currentPage.value}(0-based), size=${currentSize.value}, 当前页订单=${orderData.length}`)
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

// 分页：上一页
const prevPage = () => {
  if (!hasPrevPage.value) return
  fetchOrders({ tab: activeTab.value, page: currentPage.value - 1, pageSize: currentSize.value })
}

// 分页：下一页
const nextPage = () => {
  if (!hasNextPage.value) return
  fetchOrders({ tab: activeTab.value, page: currentPage.value + 1, pageSize: currentSize.value })
}

// 分页：跳转到指定页（输入框为 1-based，传参 -1 变成 0-based）
const gotoPage = () => {
  const raw = String(gotoPageInput.value || '').trim()
  if (!raw) return
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) {
    error.value = '页码必须是大于等于 1 的数字'
    return
  }
  const page0Based = Math.min(Math.floor(n) - 1, totalPages.value - 1)
  gotoPageInput.value = ''
  fetchOrders({ tab: activeTab.value, page: page0Based, pageSize: currentSize.value })
}

// 分页：切换每页条数
const changePageSize = (size) => {
  const s = Number(size)
  if (!Number.isFinite(s) || s <= 0) return
  fetchOrders({ tab: activeTab.value, page: 0, pageSize: s })
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

/* 当前选中的 tab 高亮 */
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

/* 分页栏 */
.pagination-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.page-btn {
  padding: 6px 14px;
  border: 1px solid #BDBDBD;
  background: #fff;
  color: #333;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  background: #E3F2FD;
  border-color: #1976D2;
  color: #1976D2;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.page-info {
  color: #555;
  font-size: 13px;
}

.page-sep {
  color: #ccc;
}

.page-size {
  padding: 6px 10px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  font-size: 13px;
  background: #fff;
  color: #333;
  cursor: pointer;
}

.page-size:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
}

.page-input {
  padding: 6px 10px;
  border: 1px solid #BDBDBD;
  border-radius: 4px;
  font-size: 13px;
  width: 70px;
  background: #fff;
  color: #333;
}

.page-input:focus {
  outline: none;
  border-color: #1976D2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.15);
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
  flex-direction: row;
  align-items: center;
  gap: 8px;
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

.btn-copy {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid #BDBDBD;
  background: #fff;
  color: #555;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-copy:hover {
  background: #E3F2FD;
  border-color: #1976D2;
  color: #1976D2;
}

.meta-tag {
  padding: 2px 8px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
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

/* 订单头部/买家留言/卖家备注 */
.remarks-section {
  grid-column: 1 / -1;
  background: #FFF9C4;
  border-left: 4px solid #FBC02D;
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remark-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.remark-label {
  font-weight: 600;
  white-space: nowrap;
  color: #6D4C41;
}

.remark-item.buyer-remark .remark-label {
  color: #5D4037;
}

.remark-item.seller-remark {
  background: #FFECB3;
  border-radius: 4px;
  padding: 4px 8px;
}

.remark-item.seller-remark .remark-label {
  color: #1565C0;
}

.remark-text {
  color: #4E342E;
  line-height: 1.5;
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

/* 原始数据查看面板样式 */
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