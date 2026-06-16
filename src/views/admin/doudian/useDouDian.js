import { ref, computed } from 'vue'
import jinriApiService from '@/services/jinriApiService'

export function useDouDian() {
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
  const currentPage = ref(0)
  const currentSize = ref(10)
  const totalCount = ref(0)
  const gotoPageInput = ref('')

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

  // 从原始响应中提取顶层字段
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

  // 提取第一条订单的所有字段
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
  const checkLoginStatus = async () => {
    checking.value = true
    error.value = ''
    debugInfo.value = { code: null, msg: null }

    try {
      const result = await jinriApiService.checkLogin()
      console.log('[抖店助手] checkLogin 返回:', result)

      if (result.success) {
        loginStatus.value = {
          isLoggedIn: result.isLoggedIn,
          cookieCount: result.cookieCount
        }
        debugInfo.value = {
          code: result.code ?? null,
          msg: result.msg ?? null
        }
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
  const fetchOrders = async (opts = {}) => {
    const tab = typeof opts === 'string' ? opts : (opts.tab || 'all')
    const page = typeof opts === 'string' ? 0 : (opts.page ?? currentPage.value)
    const pageSize = typeof opts === 'string' ? currentSize.value : (opts.pageSize ?? currentSize.value)

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
        if (result.data && result.data.code === '10008') {
          error.value = '🔒 ' + (result.data.msg || '登录信息已失效，请重新登录')
          loginStatus.value.isLoggedIn = false
          orders.value = []
          return
        }

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

  // 分页操作
  const prevPage = () => {
    if (!hasPrevPage.value) return
    fetchOrders({ tab: activeTab.value, page: currentPage.value - 1, pageSize: currentSize.value })
  }

  const nextPage = () => {
    if (!hasNextPage.value) return
    fetchOrders({ tab: activeTab.value, page: currentPage.value + 1, pageSize: currentSize.value })
  }

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

  const changePageSize = (size) => {
    const s = Number(size)
    if (!Number.isFinite(s) || s <= 0) return
    fetchOrders({ tab: activeTab.value, page: 0, pageSize: s })
  }

  // 格式化
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '0.00'
    return (amount / 100).toFixed(2)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '-'
    if (typeof timestamp === 'number') {
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

  // 状态映射
  const getStatusClass = (status) => {
    const statusMap = {
      1: 'pending',
      2: 'pending',
      3: 'shipped',
      4: 'completed',
      5: 'cancelled',
      6: 'cancelled',
      7: 'pending',
      8: 'pending',
      21: 'pending',
      22: 'shipped',
      29: 'completed',
      101: 'cancelled',
      105: 'cancelled'
    }
    return statusMap[status] || 'unknown'
  }

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

  // 复制文本
  const copyText = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch (e) {
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

  return {
    loading,
    checking,
    hasFetched,
    activeTab,
    loginStatus,
    debugInfo,
    orders,
    error,
    currentPage,
    currentSize,
    totalCount,
    gotoPageInput,
    rawApiResponse,
    showRawData,
    totalPages,
    humanCurrentPage,
    hasPrevPage,
    hasNextPage,
    tabTitle,
    rawTopLevelKeys,
    rawSampleOrder,
    checkLoginStatus,
    fetchOrders,
    prevPage,
    nextPage,
    gotoPage,
    changePageSize,
    formatAmount,
    formatTime,
    getStatusClass,
    getStatusText,
    copyText
  }
}
