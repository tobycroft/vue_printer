<template>
  <div class="admin-layout">
    <!-- 左侧菜单 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-icon">🖨️</div>
        <h2>Vue Printer</h2>
        <div class="version">v1.0.0</div>
      </div>
      <nav class="menu">
        <router-link 
          v-for="menu in menus" 
          :key="menu.path"
          :to="menu.path"
          class="menu-item"
          :class="{ active: $route.path === menu.path }"
        >
          <span class="menu-icon">{{ menu.icon }}</span>
          <span class="menu-text">{{ menu.title }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <p>© 2026 Vue Printer</p>
      </div>
    </aside>

    <!-- 右侧内容区域 -->
    <main class="content-wrapper">
      <header class="content-header">
        <h1>{{ $route.meta.title }}</h1>
      </header>
      <div class="content-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const menus = ref([
  { path: '/admin/home', title: '首页', icon: '🏠' },
  { path: '/admin/userinfo', title: '用户信息', icon: '👤' },
  { path: '/admin/printers', title: '打印机管理', icon: '🖨️' },
  { path: '/admin/templates', title: '打印模板管理', icon: '📄' },
  { path: '/admin/help', title: '帮助', icon: '❓' },
  { path: '/admin/about', title: '关于', icon: '️' }
])
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #1a1a1a;
  margin: 0;
  padding: 0;
}

/* 左侧菜单样式 */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: #2d2d2d;
  color: #e0e0e0;
  border-right: 1px solid #3d3d3d;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  margin: 0;
  position: relative;
  left: 0;
}

.sidebar-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.sidebar-header h2 {
  margin: 0 0 5px 0;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.version {
  font-size: 12px;
  color: #999;
}

.menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: #b0b0b0;
  text-decoration: none;
  transition: all 0.2s;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  background: #252525;
  border: 1px solid transparent;
}

.menu-item:hover {
  background: #353535;
  color: #ffffff;
}

.menu-item.active {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: #ffffff;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.menu-icon {
  margin-right: 12px;
  font-size: 18px;
}

.menu-text {
  font-size: 15px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #3d3d3d;
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* 右侧内容区域样式 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: #1a1a1a;
  margin: 0;
  padding: 0;
}

.content-header {
  padding: 30px 50px;
  background: #1a1a1a;
  border-bottom: 1px solid #3d3d3d;
}

.content-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #ffffff;
}

.content-body {
  flex: 1;
  padding: 40px 50px;
  overflow-y: auto;
  width: 100%;
  min-height: 0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #3d3d3d;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4d4d4d;
}
</style>