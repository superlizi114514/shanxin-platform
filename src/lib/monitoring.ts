/**
 * 山信二手平台 - 性能监控配置
 *
 * 集成 Vercel Analytics 和自定义性能指标追踪
 */

'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals 性能指标报告
 * 在 app/layout.tsx 中使用
 */
export function useWebVitalsReport() {
  useReportWebVitals((metric) => {
    // 发送到 Vercel Analytics
    // Vercel 会自动收集这些指标

    // 同时发送到自定义分析端点（可选）
    const body = {
      d: {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        page: window.location.pathname,
      },
    };

    // 仅在生产环境发送
    if (process.env.NODE_ENV === 'production') {
      // 使用 sendBeacon 确保数据发送成功
      const blob = new Blob([JSON.stringify(body)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics', blob);
    }
  });
}

/**
 * 页面性能指标类型
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte

  // 自定义指标
  pageLoadTime?: number;
  domContentLoaded?: number;
  memoryUsage?: number;
}

/**
 * 获取当前页面性能指标
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {};

  // 获取 Navigation Timing API 数据
  if (typeof performance !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType('paint');

    if (navigation) {
      metrics.ttfb = navigation.responseStart;
      metrics.domContentLoaded = navigation.domContentLoadedEventEnd;
      metrics.pageLoadTime = navigation.loadEventEnd;
    }

    // 获取绘制指标
    paint.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.fcp = entry.startTime;
      }
    });
  }

  // 获取内存使用情况（仅 Chrome/Edge 支持）
  if ('memory' in performance) {
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
    metrics.memoryUsage = perf.memory?.usedJSHeapSize;
  }

  return metrics;
}

/**
 * 错误监控 - 全局错误捕获
 */
export function setupErrorMonitoring() {
  if (typeof window === 'undefined') return;

  // 捕获全局 JavaScript 错误
  window.addEventListener('error', (event) => {
    reportError({
      type: 'error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // 捕获未处理的 Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      type: 'unhandledrejection',
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
    });
  });
}

/**
 * 报告错误到分析端点
 */
function reportError(errorData: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Monitor]', errorData);
    return;
  }

  const body = {
    d: {
      ...errorData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
  };

  const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
  navigator.sendBeacon('/api/analytics/errors', blob);
}

/**
 * 用户行为追踪（可选，用于分析用户交互）
 */
export function trackUserAction(action: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Action Track]', action, details);
    return;
  }

  const body = {
    d: {
      type: 'action',
      action,
      ...details,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
  };

  const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
  navigator.sendBeacon('/api/analytics', blob);
}

/**
 * 页面浏览追踪
 */
export function trackPageView(pathname: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Page View]', pathname);
    return;
  }

  const body = {
    d: {
      type: 'pageview',
      path: pathname,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    },
  };

  const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
  navigator.sendBeacon('/api/analytics', blob);
}
