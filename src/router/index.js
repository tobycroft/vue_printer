import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../layout/Layout.vue'
import Home from '../views/admin/Home.vue'
import UserInfo from '../views/admin/UserInfo.vue'
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