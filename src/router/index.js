import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../layout/Layout.vue'
import Home from '../views/admin/Home.vue'
import UserInfo from '../views/admin/UserInfo.vue'
import Settings from '../views/admin/Settings.vue'
import Templates from '../views/admin/Templates.vue'
import Connection from '../views/admin/Connection.vue'
import About from '../views/admin/About.vue'
import Help from '../views/admin/Help.vue'
import Printers from '../views/admin/Printers.vue'

const routes = [
  {
    path: '/',
    redirect: '/admin/home'
  },
  {
    path: '/admin',
    component: Layout,
    children: [
      {
        path: 'home',
        name: 'Home',
        component: Home,
        meta: { title: '首页' }
      },
      {
        path: 'userinfo',
        name: 'UserInfo',
        component: UserInfo,
        meta: { title: '用户信息' }
      },
      {
        path: 'templates',
        name: 'Templates',
        component: Templates,
        meta: { title: '模板管理' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { title: '打印设置' }
      },
      {
        path: 'connection',
        name: 'Connection',
        component: Connection,
        meta: { title: 'C-LODOP 连接' }
      },
      {
        path: 'about',
        name: 'About',
        component: About,
        meta: { title: '关于' }
      },
      {
        path: 'help',
        name: 'Help',
        component: Help,
        meta: { title: '帮助' }
      },
      {
        path: 'printers',
        name: 'Printers',
        component: Printers,
        meta: { title: '打印机管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/admin/home'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router