import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../layout/Layout.vue'
import Home from '../views/admin/Home.vue'
import Settings from '../views/admin/Settings.vue'

const routes = [
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
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { title: '设置' }
      },
      {
        path: '',
        redirect: '/admin/home'
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