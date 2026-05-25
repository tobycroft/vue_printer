---
name: vue-printer-frontend-workflow
description: Vue Printer 项目前端开发工作流。修改 Vue 组件、HTML 或样式后自动执行 build、验证构建产物、git commit 和 push。适用于 Chrome Extension + Vue 3 + Vite 项目，确保资源路径正确、文件完整。
---

# Vue Printer 前端开发工作流

## 核心原则

**每次修改前端代码后必须执行完整流程：**
1. 构建项目 (`npm run build`)
2. 验证构建产物（检查关键文件是否存在）
3. Git 提交并推送

## 工作流程

### 步骤 1：构建项目

```bash
cd e:\MyDoc\IdeaProject\vue_printer && npm run build
```

等待构建完成，确认没有错误。

### 步骤 2：验证构建产物

**必须检查以下文件是否存在：**

```bash
# 检查 HTML 入口文件
ls dist/index.html
ls dist/login.html
ls dist/popup/auth.html
ls dist/popup/popup.html

# 检查 manifest.json
ls dist/manifest.json

# 检查关键资源目录
ls dist/assets/
ls dist/icons/
ls dist/content/
```

**验证要点：**
- ✅ 所有 HTML 文件都存在
- ✅ `dist/popup/` 子目录存在
- ✅ `dist/assets/` 目录包含 JS 和 CSS 文件
- ✅ `dist/manifest.json` 存在且未被覆盖

**常见问题检查：**
- 如果 `dist/popup/auth.html` 不存在 → vite.config.js 的 post-build 脚本可能失败
- 如果资源路径是 `/assets/` 而不是 `./assets/` 或 `../assets/` → base 配置错误
- 如果 `dist/` 为空 → 构建失败，检查控制台错误

### 步骤 3：Git 提交和推送

使用 Conventional Commits 规范：

```bash
cd e:\MyDoc\IdeaProject\vue_printer
git add .
git commit -m "type(scope): description"
git push
```

**Commit Type 选择：**
- `feat`: 新功能
- `fix`: 修复 bug
- `refactor`: 重构代码
- `style`: 样式调整
- `docs`: 文档更新
- `chore`: 构建配置、依赖更新

**示例：**
```bash
git commit -m "fix(popup): 修复认证页面资源加载路径问题"
git commit -m "feat(login): 添加登录表单验证逻辑"
git commit -m "refactor(auth): 重构验证码获取逻辑"
```

## 关键注意事项

### Chrome Extension 路径问题

**问题：** Vite 默认生成绝对路径 `/assets/...`，但 Chrome Extension 使用 `file://` 协议不支持。

**解决方案：** vite.config.js 中已配置 `base: './'`

**验证方法：**
```bash
# 检查生成的 HTML 文件中的 script/link 标签
cat dist/popup/auth.html | grep "src="
# 应该看到：src="../assets/popup/auth-xxx.js" （子目录用 ../）
# 或：src="./assets/login-xxx.js" （根目录用 ./）
```

### 子目录路径特殊处理

vite.config.js 的 `copyNonHtmlToDist()` 函数会自动修复：
- `dist/popup/auth.html` 和 `dist/popup/popup.html` 中的路径从 `./assets/` 改为 `../assets/`
- `dist/login.html` 和 `dist/index.html` 保持 `./assets/`

### 临时 HTML 文件

项目根目录有以下临时文件（供 Vite 处理）：
- `popup-auth.html` → 生成 `dist/popup/auth.html`
- `popup-page.html` → 生成 `dist/popup/popup.html`
- `login-page.html` → 生成 `dist/login.html`

**不要删除这些文件！** 它们是 Vite 多入口配置必需的。

## 快速检查清单

修改代码后，按此清单操作：

```
✅ 1. 执行 npm run build
✅ 2. 检查 dist/index.html 存在
✅ 3. 检查 dist/login.html 存在
✅ 4. 检查 dist/popup/auth.html 存在
✅ 5. 检查 dist/popup/popup.html 存在
✅ 6. 检查 dist/manifest.json 存在
✅ 7. 检查 dist/assets/ 有 JS/CSS 文件
✅ 8. 验证 HTML 中的资源路径正确（./ 或 ../）
✅ 9. git add . && git commit -m "..."
✅ 10. git push
```

## 常见错误及解决

### 错误 1：ERR_FILE_NOT_FOUND

**症状：** Chrome Extension 白屏，控制台报错 `Failed to load resource: net::ERR_FILE_NOT_FOUND`

**原因：** 资源路径不正确

**解决：**
1. 检查 `dist/popup/auth.html` 中的路径是否为 `../assets/...`
2. 如果不是，重新运行 `npm run build`
3. 验证 vite.config.js 中的 `copyNonHtmlToDist()` 函数是否正确执行

### 错误 2：构建后 dist 目录为空

**原因：** Vite 构建失败

**解决：**
1. 查看构建输出的错误信息
2. 检查是否有语法错误
3. 确认所有 import 路径正确

### 错误 3：git push 失败

**原因：** 远程有更新或网络问题

**解决：**
```bash
git pull --rebase
git push
```

## 参考文件

- vite.config.js - Vite 构建配置（包含 post-build 脚本）
- public/manifest.json - Chrome Extension 配置
- src/views/ - Vue 组件目录
- popup-auth.html, popup-page.html, login-page.html - 临时入口文件
