<template>
  <div class="ws-log-container">
    <div class="log-header">
      <div>
        <h2>WebSocket 日志</h2>
        <p>最近 100 条 WebSocket 通信记录</p>
      </div>
      <div class="header-actions">
        <div class="status-indicator" :class="wsState">
          <span class="dot"></span>
          <span class="label">{{ stateText }}</span>
        </div>
        <button class="btn-clear" @click="clearLogs">清空日志</button>
        <button class="btn-refresh" @click="refreshLogs">刷新</button>
      </div>
    </div>

    <div class="log-stats">
      <div class="stat-item"><span class="stat-label">总条数</span><span class="stat-value">{{ logs.length }}/100</span></div>
      <div class="stat-item success"><span class="stat-label">✓ 成功</span><span class="stat-value">{{ countByType('success') }}</span></div>
      <div class="stat-item recv"><span class="stat-label">↓ 接收</span><span class="stat-value">{{ countByType('recv') }}</span></div>
      <div class="stat-item send"><span class="stat-label">↑ 发送</span><span class="stat-value">{{ countByType('send') }}</span></div>
      <div class="stat-item info"><span class="stat-label">ℹ 信息</span><span class="stat-value">{{ countByType('info') }}</span></div>
      <div class="stat-item warning"><span class="stat-label">⚠ 警告</span><span class="stat-value">{{ countByType('warning') }}</span></div>
      <div class="stat-item error"><span class="stat-label">✗ 错误</span><span class="stat-value">{{ countByType('error') }}</span></div>
    </div>

    <div class="log-filter">
      <button
        v-for="filter in filters"
        :key="filter.key"
        class="filter-btn"
        :class="{ active: activeFilter === filter.key }"
        @click="activeFilter = filter.key"
      >
        {{ filter.label }}
      </button>
    </div>

    <div class="log-list" ref="logListRef">
      <div v-if="filteredLogs.length === 0" class="log-empty">
        <p>暂无日志记录</p>
      </div>
      <div
        v-for="log in filteredLogs"
        :key="log.id"
        class="log-item"
        :class="'log-' + log.type"
      >
        <div class="log-left">
          <div class="log-type">{{ typeLabels[log.type] || log.type }}</div>
        </div>
        <div class="log-main">
          <div class="log-time">{{ log.time }}</div>
          <div class="log-content" @click="toggleDetail(log)">
            <span v-if="!expandedIds.has(log.id)">{{ truncate(log.content, 120) }}</span>
            <pre v-else>{{ formatJSON(log.content) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const logs = ref([])
const wsState = ref('disconnected')
const activeFilter = ref('all')
const expandedIds = ref(new Set())
const logListRef = ref(null)

const typeLabels = {
  success: '成功',
  info: '信息',
  recv: '接收',
  send: '发送',
  warning: '警告',
  error: '错误'
}

const filters = [
  { key: 'all', label: '全部' },
  { key: 'success', label: '成功' },
  { key: 'recv', label: '接收' },
  { key: 'send', label: '发送' },
  { key: 'info', label: '信息' },
  { key: 'warning', label: '警告' },
  { key: 'error', label: '错误' }
]

const stateText = computed(() => {
  switch (wsState.value) {
    case 'connected': return '实时推送已连接'
    case 'connecting': return '正在连接...'
    case 'disconnected': return '实时推送未连接'
    default: return '未知状态'
  }
})

const filteredLogs = computed(() => {
  if (activeFilter.value === 'all') return logs.value
  return logs.value.filter(l => l.type === activeFilter.value)
})

function countByType(type) {
  return logs.value.filter(l => l.type === type).length
}

function truncate(str, len) {
  if (!str) return ''
  if (str.length <= len) return str
  return str.slice(0, len) + '... [点击展开]'
}

function formatJSON(content) {
  if (!content) return ''
  try {
    const obj = JSON.parse(content)
    return JSON.stringify(obj, null, 2)
  } catch {
    return content
  }
}

function toggleDetail(log) {
  if (expandedIds.value.has(log.id)) {
    expandedIds.value.delete(log.id)
  } else {
    expandedIds.value.add(log.id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

async function refreshLogs() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'wsGetLogs' })
      if (response && response.logs) {
        logs.value = response.logs.slice().reverse()
      }
    } catch (e) {
      console.error('获取日志失败:', e)
    }
  }
}

async function clearLogs() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      await chrome.runtime.sendMessage({ action: 'wsClearLogs' })
      logs.value = []
    } catch (e) {
      console.error('清空日志失败:', e)
    }
  }
}

async function fetchState() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      const state = await chrome.runtime.sendMessage({ action: 'wsGetState' })
      if (state) wsState.value = state.state
    } catch (e) {
      console.error('获取状态失败:', e)
    }
  }
}

function onMessage(msg) {
  if (msg.action === 'websocketLogAdded' && msg.log) {
    logs.value = [msg.log, ...logs.value].slice(0, 100)
  } else if (msg.action === 'websocketStateChange' && msg.state) {
    wsState.value = msg.state
  }
}

onMounted(() => {
  refreshLogs()
  fetchState()
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener(onMessage)
  }
})

onUnmounted(() => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.removeListener(onMessage)
  }
})
</script>

<style scoped>
.ws-log-container {
  max-width: 1200px;
  margin: 0 auto;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
}

.log-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.log-header p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  font-size: 14px;
}

.status-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
}

.status-indicator.connected {
  color: #4CAF50;
  border-color: rgba(76, 175, 80, 0.3);
}
.status-indicator.connected .dot { background: #4CAF50; box-shadow: 0 0 6px #4CAF50; }

.status-indicator.connecting {
  color: #FF9800;
  border-color: rgba(255, 152, 0, 0.3);
}
.status-indicator.connecting .dot { background: #FF9800; box-shadow: 0 0 6px #FF9800; }

.status-indicator.disconnected {
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.3);
}
.status-indicator.disconnected .dot { background: #f44336; box-shadow: 0 0 6px #f44336; }

.status-indicator .label { color: inherit; }

.btn-clear,
.btn-refresh {
  padding: 8px 18px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover { background: #3d2525; border-color: #f44336; color: #f44336; }
.btn-refresh:hover { background: #2d3d2d; border-color: #4CAF50; color: #4CAF50; }

.log-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  min-width: 110px;
  padding: 12px 16px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item.success { border-left: 3px solid #4CAF50; }
.stat-item.recv { border-left: 3px solid #2196F3; }
.stat-item.send { border-left: 3px solid #9C27B0; }
.stat-item.info { border-left: 3px solid #607D8B; }
.stat-item.warning { border-left: 3px solid #FF9800; }
.stat-item.error { border-left: 3px solid #f44336; }

.stat-label { font-size: 12px; color: #999; }
.stat-value { font-size: 18px; font-weight: 600; color: #ffffff; }

.log-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  color: #b0b0b0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover { color: #e0e0e0; border-color: #555; }
.filter-btn.active { background: #2196F3; color: #fff; border-color: #2196F3; }

.log-list {
  background: #252525;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-list::-webkit-scrollbar { width: 10px; }
.log-list::-webkit-scrollbar-track { background: #1a1a1a; }
.log-list::-webkit-scrollbar-thumb { background: #444; border-radius: 5px; }

.log-empty {
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.log-item {
  display: flex;
  gap: 14px;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.log-item:last-child { border-bottom: none; }
.log-item:hover { background: rgba(255, 255, 255, 0.03); }

.log-left { flex-shrink: 0; }

.log-type {
  min-width: 48px;
  text-align: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #3d3d3d;
  color: #b0b0b0;
}

.log-success .log-type { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
.log-info .log-type { background: rgba(96, 125, 139, 0.2); color: #90A4AE; }
.log-recv .log-type { background: rgba(33, 150, 243, 0.2); color: #2196F3; }
.log-send .log-type { background: rgba(156, 39, 176, 0.2); color: #CE93D8; }
.log-warning .log-type { background: rgba(255, 152, 0, 0.2); color: #FF9800; }
.log-error .log-type { background: rgba(244, 67, 54, 0.2); color: #f44336; }

.log-main { flex: 1; min-width: 0; }

.log-time {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.log-content {
  color: #e0e0e0;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

.log-content pre {
  margin: 0;
  padding: 8px 10px;
  background: #1a1a1a;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  color: #9fd4ff;
  border: 1px solid #333;
}
</style>