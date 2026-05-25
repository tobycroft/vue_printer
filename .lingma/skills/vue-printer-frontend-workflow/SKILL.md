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

## 前后端接口契约

### API 响应格式标准

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应：**
```json
{
  "code": -1,
  "message": "error description",
  "data": null
}
```

### 数据命名规范

- **后端 (TuuzGoWeb)**: snake_case (`user_name`, `token_id`)
- **前端 (Vue)**: camelCase (`userName`, `tokenId`)
- **数据库**: snake_case (`user_name`, `created_at`)

**转换规则：**
- 后端返回 JSON 时使用 Go struct tag: `` `json:"userName"` ``
- 前端接收后直接使用 camelCase
- 发送请求时将 camelCase 转换为 snake_case（如需要）

## 开发检查清单

### 前端修改后检查

```markdown
代码修改阶段：
- [ ] Vue 组件语法正确（无 lint 错误）
- [ ] 样式使用 scoped 避免污染
- [ ] ID 属性唯一（使用 class 替代重复 ID）
- [ ] 路由跳转路径正确
- [ ] API 调用错误处理完善

构建验证阶段：
- [ ] npm run build 成功执行
- [ ] dist/index.html 存在
- [ ] dist/login.html 存在
- [ ] dist/popup/auth.html 存在
- [ ] dist/popup/popup.html 存在
- [ ] dist/manifest.json 存在且未被覆盖
- [ ] dist/assets/ 包含所有 JS/CSS 文件
- [ ] HTML 中资源路径正确（./ 或 ../）

Git 提交阶段：
- [ ] 使用 Conventional Commits 规范
- [ ] commit message 清晰描述变更
- [ ] git push 成功
```

### 常见 Commit Type

- `feat`: 新功能（例：`feat(auth): 添加短信验证码登录`）
- `fix`: 修复 bug（例：`fix(popup): 修复资源加载路径问题`）
- `refactor`: 重构代码（例：`refactor(login): 优化表单验证逻辑`）
- `style`: 样式调整（例：`style(home): 调整卡片间距`）
- `docs`: 文档更新（例：`docs(readme): 更新安装说明`）
- `chore`: 构建配置（例：`chore(vite): 添加 post-build 脚本`）

## 跨技术栈协作

### 场景 1: 修改后端 API 后更新前端

```markdown
1. 后端开发（tuuzgoweb-developer）
   - 修改 API 接口
   - 更新响应数据结构
   - 测试 API 可用性

2. 前端适配（vue-frontend-developer）
   - 更新 API 调用参数
   - 调整数据解析逻辑
   - 测试页面功能

3. 构建验证
   - npm run build
   - 验证所有文件存在
   - git commit && git push
```

### 场景 2: 新增功能需要前后端配合

```markdown
示例：添加用户头像上传功能

后端任务：
- 创建 /api/user/avatar 接口
- 实现文件上传和存储逻辑
- 返回头像 URL

前端任务：
- 创建 AvatarUpload.vue 组件
- 集成文件选择器
- 调用上传 API
- 显示上传进度

扩展任务（如需要）：
- 在 popup 中添加快捷上传入口
- 实现拖拽上传功能
```

## 高级故障排查

### 问题 1: 构建成功但扩展不工作

**症状：** dist 文件都存在，但 Edge 中扩展白屏或功能异常

**排查步骤：**
1. 打开 Edge 开发者工具（F12）
2. 查看 Console 是否有错误
3. 检查 Network 面板资源加载状态
4. 验证 manifest.json 中的路径配置
5. 重新加载扩展（edge://extensions/ → 刷新按钮）

### 问题 2: 热更新不生效

**症状：** 修改 Vue 组件后浏览器未自动刷新

**原因：** Chrome Extension 不支持 Vite HMR

**解决：**
- 手动刷新扩展页面
- 或重新加载扩展
- 生产环境始终使用 `npm run build`

### 问题 3: 样式冲突

**症状：** 组件样式影响到其他页面

**解决：**
- 确保使用 `<style scoped>`
- 避免使用全局选择器
- 使用 CSS Modules 或 BEM 命名规范

## 性能优化建议

### 构建优化

```javascript
// vite.config.js 中可以添加
css: {
  preprocessorOptions: {
    scss: {
      additionalData: '@import "@/styles/variables.scss";'
    }
  }
},
optimizeDeps: {
  include: ['vue', 'vue-router']
}
```

### 代码分割

- 使用 Vue Router 的懒加载：
```javascript
const Home = () => import('@/views/Home.vue')
```

- 大型组件按需加载：
```javascript
const HeavyComponent = defineAsyncComponent(
  () => import('@/components/HeavyComponent.vue')
)
```

## 版本管理

### 版本号规范

遵循 SemVer 规范：`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修正

### 发布流程

```bash
# 1. 更新 package.json 版本号
# 2. 构建项目
npm run build

# 3. 验证构建产物
ls dist/

# 4. 提交并打标签
git add .
git commit -m "chore: release v1.2.3"
git tag v1.2.3
git push origin master --tags
```

## 相关 Skills

- **fullstack-coordinator**: 协调 TuuzGoWeb 后端、Vue 前端和 Edge 扩展的全栈开发
- **vue-frontend-developer**: 专业的 Vue 前端开发技能
- **edge-extension-developer**: Edge 浏览器扩展开发专家

当任务涉及多个技术栈时，使用 `fullstack-coordinator` 进行任务分解和协调。
