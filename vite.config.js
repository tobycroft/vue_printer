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

  const items = require('fs').readdirSync(publicDir)
  items.forEach(item => {
    if (item.endsWith('.html')) {
      return
    }
    
    const srcPath = resolve(publicDir, item)
    const destPath = resolve(distDir, item)
    cpSync(srcPath, destPath, { recursive: true })
  })
  
  const popupAuthSrc = resolve(distDir, 'popup-auth.html')
  const popupPageSrc = resolve(distDir, 'popup-page.html')
  const loginSrc = resolve(distDir, 'login-page.html')
  
  const popupAuthPath = resolve(distDir, 'popup', 'auth.html')
  const popupPagePath = resolve(distDir, 'popup', 'popup.html')
  const loginPath = resolve(distDir, 'login.html')
  
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
  
  [popupAuthPath, popupPagePath].forEach(filePath => {
    if (existsSync(filePath)) {
      let content = readFileSync(filePath, 'utf-8')
      content = content.replace(/\.\/assets\//g, '../assets/')
      writeFileSync(filePath, content, 'utf-8')
    }
  })
}

export default defineConfig(({ mode }) => {
  const isExtensionBuild = mode === 'extension'
  
  return {
    plugins: [
      vue(),
      vueDevTools(),
      {
        name: 'extension-build',
        closeBundle() {
          if (isExtensionBuild) {
            copyNonHtmlToDist()
          }
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
      rollupOptions: isExtensionBuild ? {
        input: {
          main: resolve(__dirname, 'index.html'),
          'popup/popup': resolve(__dirname, 'popup-page.html'),
          login: resolve(__dirname, 'login-page.html'),
          'popup/auth': resolve(__dirname, 'popup-auth.html'),
        },
      } : {},
    },
    base: isExtensionBuild ? './' : '/',
  }
})
