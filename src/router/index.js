import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/Layout.vue'
import Home from '../views/admin/Home.vue'
import Settings from '../views/admin/Settings.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'Home',
        component: Home,
        meta: { title: '首页' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { title: '设置' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router