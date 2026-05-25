<template>
  <div class="admin-layout">
    <!-- 左侧菜单 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Vue Printer</h2>
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
  { path: '/admin/settings', title: '设置', icon: '⚙️' }
])
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f5f7fa;
}

/* 左侧菜单样式 */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #4a5f7a;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.menu {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-left-color: #3498db;
}

.menu-item.active {
  background-color: rgba(52, 152, 219, 0.2);
  border-left-color: #3498db;
  font-weight: 500;
}

.menu-icon {
  margin-right: 12px;
  font-size: 16px;
}

.menu-text {
  font-size: 14px;
}

/* 右侧内容区域样式 */
.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 20px 30px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.content-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.content-body {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>