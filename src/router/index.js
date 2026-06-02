import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../layout/Layout.vue'
import Home from '../views/admin/Home.vue'
import UserInfo from '../views/admin/UserInfo.vue'
import About from '../views/admin/About.vue'
import Help from '../views/admin/Help.vue'
import Printers from '../views/admin/Printers.vue'
import LocalPrinters from '../views/admin/LocalPrinters.vue'
import Templates from '../views/admin/Templates.vue'
import SystemSettings from '../views/admin/SystemSettings.vue'
import TemplateEditor from '../views/admin/TemplateEditor.vue'

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
        path: 'local-printers',
        name: 'LocalPrinters',
        component: LocalPrinters,
        meta: { title: '本地打印机' }
      },
      {
        path: 'printers',
        name: 'Printers',
        component: Printers,
        meta: { title: '所有打印机' }
      },
      {
        path: 'templates',
        name: 'Templates',
        component: Templates,
        meta: { title: '打印模板管理' }
      },
      {
        path: 'system-settings',
        name: 'SystemSettings',
        component: SystemSettings,
        meta: { title: '系统设置' }
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
      }
    ]
  },
  {
    path: '/template-editor',
    name: 'TemplateEditor',
    component: TemplateEditor,
    meta: { title: '模板编辑器' }
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
