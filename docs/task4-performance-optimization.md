# 任务四：性能优化

## 需求概述
优化页面加载速度和交互流畅度。

## 优化项

### 1. 图片懒加载
- 使用 `<Image loading="lazy">` 替换 `<img>`
- 配置 `next.config.ts` remotePatterns

### 2. 列表虚拟滚动
- 安装 `@tanstack/react-virtual`
- 长列表使用虚拟滚动（商品/点评/消息列表）

### 3. API 缓存
- 安装 `@tanstack/react-query`
- 默认缓存 5 分钟

### 4. Skeleton 加载状态
- 创建通用 Skeleton 组件
- 各列表页添加 Skeleton

### 5. 过渡动画
- `globals.css` 添加过渡动画配置
- 按钮点击反馈
- 卡片悬停效果

### 6. 性能监控
- 安装 `web-vitals`
- 监控 LCP/FID/CLS/TTFB

## 目标指标
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

## 验收标准
- [ ] 图片懒加载生效
- [ ] 列表滚动无卡顿
- [ ] 加载状态有 Skeleton
- [ ] 页面过渡流畅

## 预计工作量：8 小时
