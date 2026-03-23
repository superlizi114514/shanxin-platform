# 任务四：性能和流畅度优化

## 任务概述
优化平台整体性能和用户体验流畅度，减少加载时间，提升交互响应速度。

## 优化范围
- ✅ 图片懒加载
- ✅ 列表虚拟滚动
- ✅ API 请求缓存
- ✅ 组件按需加载
- ✅ Skeleton 加载状态
- ✅ 过渡动画优化

---

## 第一步：图片懒加载

### 方案：使用 Next.js 内置优化

**1. 替换所有 `<img>` 为 `<Image>`**

文件：全局搜索 `src/app/**/*.tsx`

将：
```tsx
<img src={product.image} alt={product.title} className="..." />
```

改为：
```tsx
import Image from "next/image";

<Image
  src={product.image}
  alt={product.title}
  width={300}
  height={200}
  className="w-full h-48 object-cover"
  loading="lazy"
  priority={false} // 首屏图片设为 true
/>
```

**2. 配置远程图片域名**

文件：`next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // 或指定域名
      },
    ],
  },
};

export default nextConfig;
```

---

## 第二步：列表虚拟滚动

### 适用场景
- 商品列表（超过 20 条）
- 点评列表
- 消息列表

### 安装依赖
```bash
npm install @tanstack/react-virtual
```

### 实现示例

**文件：`src/components/VirtualList.tsx`**

```tsx
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({ items, itemHeight, renderItem }: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // 预渲染 5 条
  });

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**使用示例：**

```tsx
<VirtualList
  items={products}
  itemHeight={200}
  renderItem={(product) => <ProductCard key={product.id} product={product} />}
/>
```

---

## 第三步：API 请求缓存

### 方案：React Query (TanStack Query)

**1. 安装依赖**
```bash
npm install @tanstack/react-query
```

**2. 配置 Provider**

文件：`src/app/layout.tsx`

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 分钟
      gcTime: 10 * 60 * 1000, // 10 分钟（原 cacheTime）
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**3. 使用示例**

```tsx
import { useQuery } from "@tanstack/react-query";

function ProductList() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      return res.json();
    },
  });

  if (isLoading) return <Skeleton />;
  return <List items={data?.products} />;
}
```

---

## 第四步：组件按需加载

### 方案：Next.js 动态导入

**1. 重型组件懒加载**

文件：`src/app/merchants/page.tsx`

```tsx
import dynamic from "next/dynamic";

// 懒加载地图组件
const MapView = dynamic(() => import("@/components/MapView"), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
  ssr: false, // 仅客户端渲染
});

// 懒加载筛选器
const FilterPanel = dynamic(() => import("@/components/FilterPanel"), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />,
});
```

**2. 图表组件懒加载**

```tsx
const Chart = dynamic(() => import("@/components/Chart"), {
  loading: () => <div className="h-80 bg-gray-100 animate-pulse" />,
  ssr: false,
});
```

---

## 第五步：Skeleton 加载状态

### 新建通用 Skeleton 组件

**文件：`src/components/Skeleton.tsx`**

```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        variant === "circle" && "rounded-full",
        variant === "text" && "h-4 w-full",
        className
      )}
    />
  );
}
```

**文件：`src/components/ProductCardSkeleton.tsx`**

```tsx
import { Skeleton } from "./Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
```

**使用示例：**

```tsx
{loading
  ? Array.from({ length: 10 }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))
  : products.map((product) => <ProductCard key={product.id} product={product} />)
}
```

---

## 第六步：过渡动画优化

### CSS 配置

**文件：`src/app/globals.css`**

```css
/* 优化过渡动画 */
.transition-all {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 按钮点击反馈 */
button:active {
  transform: scale(0.98);
}

/* 卡片悬停效果 */
.card-hover {
  transition: transform 0.2s, box-shadow 0.2s;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* 减少动画时长 */
.animate-pulse {
  animation-duration: 1s; /* 原 2s */
}

/* 禁用不必要的动画 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 交互动画

**文件：`src/components/FadeIn.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-4");
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-4 transition-all duration-500"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
```

---

## 第七步：性能监控

### 添加 Web Vitals

**1. 安装依赖**
```bash
npm install web-vitals
```

**2. 创建监控组件**

**文件：`src/components/PerformanceMonitor.tsx`**

```tsx
"use client";

import { onCLS, onFID, onFCP, onLCP, onTTFB } from "web-vitals";

export function PerformanceMonitor() {
  useEffect(() => {
    onCLS(console.log);
    onFID(console.log);
    onFCP(console.log);
    onLCP(console.log);
    onTTFB(console.log);
  }, []);

  return null;
}
```

**3. 添加到布局**

**文件：`src/app/layout.tsx`**

```tsx
<body>
  <PerformanceMonitor />
  {children}
</body>
```

---

## 验收标准

### 性能指标
- [ ] LCP (最大内容绘制) < 2.5s
- [ ] FID (首次输入延迟) < 100ms
- [ ] CLS (累积布局偏移) < 0.1
- [ ] TTFB (首字节时间) < 600ms

### 体验验收
- [ ] 列表滚动无卡顿
- [ ] 图片加载有占位符
- [ ] 加载状态有 Skeleton
- [ ] 页面过渡流畅
- [ ] 按钮点击有反馈

---

## 依赖项
- 无（独立优化）

## 预计工作量
- 图片懒加载：1 小时
- 虚拟滚动：2 小时
- API 缓存：2 小时
- Skeleton：1.5 小时
- 动画优化：1 小时
- 性能监控：0.5 小时
- **总计：8 小时**

## 优先级
🔥 高优先级 - 直接影响用户体验
