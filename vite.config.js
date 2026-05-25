import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { writeFileSync, mkdirSync, existsSync, cpSync, renameSync, readFileSync } from 'fs'

function copyNonHtmlToDist() {
  const publicDir = resolve(__dirname, 'public')
  const distDir = resolve(__dirname, 'dist')

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }

  // 只复制非 HTML 文件和目录
  const items = require('fs').readdirSync(publicDir)
  items.forEach(item => {
    // 跳过 HTML 文件
    if (item.endsWith('.html')) {
      return
    }
    
    const srcPath = resolve(publicDir, item)
    const destPath = resolve(distDir, item)
    cpSync(srcPath, destPath, { recursive: true })
  })
  
  // 重命名 Vite 生成的 HTML 文件以匹配 manifest.json 的路径
  const popupAuthSrc = resolve(distDir, 'popup-auth.html')
  const popupPageSrc = resolve(distDir, 'popup-page.html')
  const loginSrc = resolve(distDir, 'login-page.html')
  
  const popupAuthPath = resolve(distDir, 'popup', 'auth.html')
  const popupPagePath = resolve(distDir, 'popup', 'popup.html')
  const loginPath = resolve(distDir, 'login.html')
  
  // 确保目标目录存在
  mkdirSync(resolve(distDir, 'popup'), { recursive: true })
  
  if (existsSync(popupAuthSrc)) {
    renameSync(popupAuthSrc, popupAuthPath)
  }
  if (existsSync(popupPageSrc)) {
    renameSync(popupPageSrc, popupPagePath)
  }
  if (existsSync(loginSrc)) {
    renameSync(loginSrc, loginPath)
  }
  
  // 修复 popup/auth.html 和 popup/popup.html 中的资源路径
  // 从 ./assets/ 改为 ../assets/
  [popupAuthPath, popupPagePath].forEach(filePath => {
    if (existsSync(filePath)) {
      let content = readFileSync(filePath, 'utf-8')
      content = content.replace(/\.\/assets\//g, '../assets/')
      writeFileSync(filePath, content, 'utf-8')
    }
  })
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'extension-build',
      closeBundle() {
        copyNonHtmlToDist()
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'popup/popup': resolve(__dirname, 'popup-page.html'),
        login: resolve(__dirname, 'login-page.html'),
        'popup/auth': resolve(__dirname, 'popup-auth.html'),
      },
    },
  },
  base: './', // 使用相对路径，适配 Chrome Extension
})
