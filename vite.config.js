import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { writeFileSync, mkdirSync, existsSync, cpSync } from 'fs'

function copyPublicToDist() {
  const publicDir = resolve(__dirname, 'public')
  const distDir = resolve(__dirname, 'dist')

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }

  cpSync(publicDir, distDir, { recursive: true })
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'extension-build',
      closeBundle() {
        copyPublicToDist()
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
        popup: resolve(__dirname, 'public/popup/popup.html'),
        login: resolve(__dirname, 'public/login.html'),
        auth: resolve(__dirname, 'public/popup/auth.html'),
      },
    },
  },
  base: './', // 使用相对路径，适配 Chrome Extension
})
