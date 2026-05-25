// UI交互模块
let isLoginMode = true;

// 显示验证码加载状态
function showCaptchaLoading() {
  const loadingEl = document.getElementById('captcha-loading');
  const imageEl = document.getElementById('captcha-img');
  if (loadingEl) loadingEl.classList.remove('hidden');
  if (imageEl) imageEl.classList.remove('visible');
}

// 隐藏验证码加载状态，显示图片
function hideCaptchaLoading() {
  const loadingEl = document.getElementById('captcha-loading');
  const imageEl = document.getElementById('captcha-img');
  if (loadingEl) loadingEl.classList.add('hidden');
  if (imageEl) imageEl.classList.add('visible');
}

// 切换登录/注册模式
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  
  const subtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit');
  const switchText = document.getElementById('switch-text');
  const confirmPasswordGroup = document.getElementById('confirm-password-group');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  if (isLoginMode) {
    subtitle.textContent = '欢迎登录您的账户';
    submitBtn.textContent = '登录';
    switchText.innerHTML = '还没有账户？<button type="button" class="link-btn" onclick="toggleAuthMode()">立即注册</button>';
    confirmPasswordGroup.style.display = 'none';
    // 移除required属性，避免隐藏字段的表单验证
    confirmPasswordInput.removeAttribute('required');
  } else {
    subtitle.textContent = '创建新账户开始使用';
    submitBtn.textContent = '注册';
    switchText.innerHTML = '已有账户？<button type="button" class="link-btn" onclick="toggleAuthMode()">立即登录</button>';
    confirmPasswordGroup.style.display = 'block';
    // 添加required属性
    confirmPasswordInput.setAttribute('required', '');
  }
  
  // 清空验证码
  document.getElementById('captcha').value = '';
  refreshCaptcha();
}

// 设置表单事件监听器
function setupFormListeners() {
  document.getElementById('auth-form').addEventListener('submit', handleSubmit);
  document.getElementById('btn-refresh-captcha').addEventListener('click', refreshCaptcha);
  document.getElementById('btn-toggle-mode').addEventListener('click', toggleAuthMode);
}

// 初始化应用
async function initAuthApp() {
  // 先检查登录状态，如果已登录直接跳转，不执行后续初始化
  await checkAuthStatus();
  
  // 如果没有跳转，继续初始化
  setupFormListeners();
  
  // 初始化时设置确认密码字段的required属性
  const confirmPasswordInput = document.getElementById('confirm-password');
  if (isLoginMode) {
    confirmPasswordInput.removeAttribute('required');
  } else {
    confirmPasswordInput.setAttribute('required', '');
  }
  
  refreshCaptcha();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  await initAuthApp();
});

// 获取当前模式
function isLogin() {
  return isLoginMode;
}

// 设置当前模式
function setLoginMode(mode) {
  isLoginMode = mode;
}