# 后台 UI 改造 - 任务一：左侧导航栏布局

## 任务目标
将现有后台改造成 **左侧固定导航栏 + 右侧内容区** 的经典布局

## 文件范围
- `src/app/admin/layout.tsx` - 新建布局文件
- `src/app/admin/page.tsx` - 改造为仪表板内容区
- `src/components/admin/Sidebar.tsx` - 新建侧边栏组件
- `src/components/admin/AdminHeader.tsx` - 新建顶部导航组件

## 实现要求

### 1. 创建 Admin Layout (`src/app/admin/layout.tsx`)
```tsx
- 左侧固定 Sidebar（宽度 256px，可折叠）
- 右侧内容区（flex-1）
- 顶部 Header（用户信息、快速操作）
```

### 2. Sidebar 组件功能
导航菜单包含：
- 📊 仪表板 (默认首页)
- 👥 用户管理
- 🏪 商家管理
- 📰 新闻管理
- 📚 信息大全
- ⭐ 点评管理
- 📈 数据统计
- ⚙️ 系统设置

### 3. 设计要求
- 使用 Tailwind CSS
- 响应式设计（移动端可隐藏）
- 激活状态高亮
- hover 效果
- 图标使用 lucide-react

### 4. 样式规范
- Sidebar 背景：`bg-slate-900` 或 `bg-white`
- 激活项：`bg-blue-600 text-white`
- hover 效果：`hover:bg-slate-800`

## 验收标准
- [ ] 左侧导航栏固定，不随内容滚动
- [ ] 点击菜单项可跳转对应页面
- [ ] 当前页面对应菜单项高亮
- [ ] 移动端适配（汉堡菜单）

## 依赖关系
- 无（可独立开发）
