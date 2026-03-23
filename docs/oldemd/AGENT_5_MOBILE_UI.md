# Agent 5 - 手机端 UI 优化与细节完善

## 负责范围

**模块边界**: 移动端响应式布局、UI 细节优化、用户体验增强、性能优化

**US 任务**: US-042 ~ US-070 (共 29 个任务)

---

## 任务清单

### P4 - 手机端 UI 优化 (核心)

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-042 | 优化首页移动端布局 | ⏳ 待执行 | `src/app/page.tsx`, `src/components/HomeCard.tsx` |
| US-043 | 优化商品列表移动端展示 | ⏳ 待执行 | `src/app/products/page.tsx` |
| US-044 | 优化商品详情页移动端 | ⏳ 待执行 | `src/app/products/[id]/page.tsx` |
| US-045 | 优化商家列表/详情移动端 | ⏳ 待执行 | `src/app/merchants/page.tsx`, `src/app/merchants/[id]/page.tsx` |
| US-046 | 优化消息页面移动端 | ⏳ 待执行 | `src/app/messages/page.tsx` |
| US-047 | 优化订单页面移动端 | ⏳ 待执行 | `src/app/orders/page.tsx` |
| US-048 | 优化个人中心移动端 | ⏳ 待执行 | `src/app/profile/page.tsx` |
| US-049 | 优化登录/注册页面移动端 | ⏳ 待执行 | `src/app/login/page.tsx`, `src/app/register/page.tsx` |
| US-050 | 优化课表页面移动端 | ⏳ 待执行 | `src/app/schedule/page.tsx` |

### P5 - 导航与交互优化

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-051 | 添加底部导航栏 (移动端) | ⏳ 待执行 | `src/components/BottomNav.tsx` |
| US-052 | 添加下拉刷新功能 | ⏳ 待执行 | `src/components/PullToRefresh.tsx` |
| US-053 | 添加上拉加载更多 | ⏳ 待执行 | `src/components/InfiniteScroll.tsx` |
| US-054 | 添加页面切换动画 | ⏳ 待执行 | `src/components/PageTransition.tsx` |
| US-055 | 添加触摸反馈效果 | ⏳ 待执行 | `src/components/TouchFeedback.tsx` |
| US-056 | 优化表单输入体验 | ⏳ 待执行 | `src/components/form/*.tsx` |

### P6 - UI 细节完善

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-057 | 统一 Loading 状态组件 | ⏳ 待执行 | `src/components/Loading.tsx` |
| US-058 | 统一空状态组件 | ⏳ 待执行 | `src/components/EmptyState.tsx` |
| US-059 | 统一错误提示组件 | ⏳ 待执行 | `src/components/ErrorState.tsx` |
| US-060 | 优化 Toast 通知组件 | ⏳ 待执行 | `src/components/Toast.tsx` |
| US-061 | 优化模态框/弹窗组件 | ⏳ 待执行 | `src/components/Modal.tsx` |
| US-062 | 统一按钮样式和尺寸 | ⏳ 待执行 | `src/components/Button.tsx` |
| US-063 | 统一输入框样式 | ⏳ 待执行 | `src/components/Input.tsx` |
| US-064 | 统一卡片组件样式 | ⏳ 待执行 | `src/components/Card.tsx` |

### P7 - 性能优化

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-065 | 图片懒加载优化 | ⏳ 待执行 | `src/components/LazyImage.tsx` |
| US-066 | 虚拟列表优化长列表 | ⏳ 待执行 | `src/components/VirtualList.tsx` |
| US-067 | 防抖/节流优化 | ⏳ 待执行 | `src/lib/debounce.ts`, `src/lib/throttle.ts` |
| US-068 | 减少不必要的重渲染 | ⏳ 待执行 | 全项目优化 |
| US-069 | 优化首屏加载速度 | ⏳ 待执行 | `src/app/layout.tsx`, `src/app/page.tsx` |

### P8 - 最终验证

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-070 | 移动端兼容性测试 | ⏳ 待执行 | 全项目测试 |

---

## 执行顺序

```
阶段 1: US-057 → US-058 → US-059 → US-060 (统一基础组件)
阶段 2: US-062 → US-063 → US-064 (统一 UI 组件)
阶段 3: US-051 (底部导航栏 - 移动端核心)
阶段 4: US-042 → US-043 → US-044 (首页和商品页面)
阶段 5: US-045 → US-046 → US-047 (商家、消息、订单)
阶段 6: US-048 → US-049 → US-050 (个人中心、登录注册、课表)
阶段 7: US-052 → US-053 → US-054 → US-055 (交互增强)
阶段 8: US-065 → US-066 → US-067 → US-068 → US-069 (性能优化)
阶段 9: US-070 (最终兼容性测试)
```

---

## 设计规范

### 移动端布局规范

#### 断点定义

```typescript
// Tailwind CSS 断点配置
const breakpoints = {
  'sm': '640px',   // 小屏手机
  'md': '768px',   // 竖屏平板
  'lg': '1024px',  // 横屏平板/小屏电脑
  'xl': '1280px',  // 桌面
  '2xl': '1536px', // 大屏桌面
};
```

#### 间距系统

```typescript
// 移动端间距规范
const spacing = {
  'xs': '4px',    // 极小间距
  'sm': '8px',    // 小间距
  'md': '16px',   // 中等间距
  'lg': '24px',   // 大间距
  'xl': '32px',   // 超大间距
  '2xl': '48px',  // 页面级间距
};
```

#### 字体大小

```typescript
// 移动端字体规范
const fontSizes = {
  'xs': '12px',   // 辅助文字
  'sm': '14px',   // 次要文字
  'base': '16px', // 正文字
  'lg': '18px',   // 小标题
  'xl': '20px',   // 中标题
  '2xl': '24px',  // 大标题
};
```

### 触摸区域规范

- 最小点击区域：**44x44px** (Apple Human Interface Guidelines)
- 按钮高度：≥ **44px**
- 输入框高度：≥ **44px**
- 列表项高度：≥ **56px**

---

## 组件设计示例

### 1. 底部导航栏 (BottomNav)

```typescript
// src/components/BottomNav.tsx
const navItems = [
  { icon: HomeIcon, label: '首页', href: '/' },
  { icon: ProductIcon, label: '商品', href: '/products' },
  { icon: MessageIcon, label: '消息', href: '/messages' },
  { icon: UserIcon, label: '我的', href: '/profile' },
];
```

### 2. Loading 组件

```typescript
// src/components/Loading.tsx
const Loading = ({ size = 'md', fullscreen = false }) => {
  // 支持多种尺寸和全屏模式
};
```

### 3. 空状态组件

```typescript
// src/components/EmptyState.tsx
const EmptyState = ({
  icon,
  title,
  description,
  actionButton
}) => {
  // 统一空状态展示
};
```

### 4. Toast 组件

```typescript
// src/components/Toast.tsx
const toast = {
  success: (message) => {},
  error: (message) => {},
  info: (message) => {},
  warning: (message) => {},
};
```

---

## 移动端优化检查清单

### 布局响应式

- [ ] 所有页面支持 320px ~ 768px 屏幕宽度
- [ ] 文字大小适配不同屏幕密度
- [ ] 图片按比例缩放，不溢出
- [ ] 表格支持横向滚动或转换为卡片

### 触摸交互

- [ ] 所有按钮 ≥ 44x44px
- [ ] 触摸反馈效果（active 状态）
- [ ] 支持左右滑动操作（如适用）
- [ ] 长按操作支持（如适用）

### 性能优化

- [ ] 图片懒加载
- [ ] 列表虚拟化（长列表）
- [ ] 防抖/节流（搜索、滚动）
- [ ] 按需加载组件

### 用户体验

- [ ] 下拉刷新
- [ ] 上拉加载更多
- [ ] 页面切换动画
- [ ] Loading 状态提示
- [ ] 空状态引导
- [ ] 错误恢复提示

---

## API 边界

### 允许调用的 API
- ✅ 所有只读 API（GET 请求）
- ✅ 用户操作 API（POST/PUT/DELETE）

### 移动端特殊处理
- 📱 分页参数：默认 `limit=10`（减少数据量）
- 📱 图片压缩：请求 `?quality=80` 参数
- 📱 离线缓存：使用 Service Worker 缓存静态资源

---

## 性能指标目标

| 指标 | 目标值 | 测量方式 |
|------|--------|----------|
| FCP (First Contentful Paint) | < 1.5s | Lighthouse |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| TTI (Time to Interactive) | < 3.5s | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| 首屏包大小 | < 150KB | Chrome DevTools |

---

## 测试设备覆盖

### iOS
- [ ] iPhone SE (小屏)
- [ ] iPhone 12/13/14 (标准屏)
- [ ] iPhone 14 Pro Max (大屏)

### Android
- [ ] 小屏 Android (540x960)
- [ ] 标准 Android (1080x1920)
- [ ] 折叠屏 (展开状态)

---

## 当前任务

**US-057**: 统一 Loading 状态组件

### 验收标准
- [ ] 创建 `src/components/Loading.tsx`
- [ ] 支持多种尺寸（sm, md, lg）
- [ ] 支持全屏模式
- [ ] 支持文字提示
- [ ] 支持骨架屏变体
- [ ] 可复用 Loading 钩子

---

## 注意事项

1. 每次迭代只完成一个用户故事
2. 完成后更新 `.ralph/progress.txt` 中对应任务的 `passes: true`
3. 更新 `.ralph/fix_plan.md` 进度
4. 输出 RALPH_STATUS 包含 EXIT_SIGNAL
5. 每个组件必须有移动端优先的设计

---

**优先级**: P4 > P5 > P6 > P7 > P8 (核心布局 → 导航交互 → UI 细节 → 性能 → 验证)
