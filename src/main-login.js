import { createApp } from 'vue';
import LoginView from './views/LoginView.vue';

const app = createApp(LoginView);
app.mount('#app');

// 确保Chrome API可用
if (typeof chrome !== 'undefined' && chrome.storage) {
  console.log('Chrome storage API is available');
} else {
  console.error('Chrome storage API is not available');
  alert('请在Edge浏览器中使用此扩展');
}