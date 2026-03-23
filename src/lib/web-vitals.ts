// 性能监控 - Web Vitals 指标上报
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
  delta: number;
  entries: PerformanceEntry[];
  attribution?: Record<string, unknown>;
}) {
  // 生产环境上报到分析服务
  if (process.env.NODE_ENV === "production") {
    const body = {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      event: {
        metric: metric.name,
        value: metric.value,
        delta: metric.delta,
        label: metric.label,
        entries: metric.entries.map((e) => ({
          name: e.name,
          entryType: e.entryType,
          startTime: e.startTime,
          duration: e.duration,
        })),
      },
    };

    // 发送到分析端点
    fetch("/api/analytics/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(console.error);
  }

  // 开发环境在控制台输出
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      delta: metric.delta,
      entries: metric.entries,
      attribution: metric.attribution,
    });
  }
}

// 目标指标
export const TARGETS = {
  LCP: 2.5 * 1000, // 2.5s
  FID: 100, // 100ms
  CLS: 0.1,
  TTFB: 800, // 800ms
  INP: 200, // 200ms
  FCP: 1.8 * 1000, // 1.8s
};

// 检查指标是否达标
export function isGood(value: number, metric: keyof typeof TARGETS): boolean {
  return value <= TARGETS[metric];
}
