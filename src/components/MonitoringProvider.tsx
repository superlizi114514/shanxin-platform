/**
 * 监控提供者组件
 *
 * 在应用启动时初始化监控系统
 */

'use client';

import { useEffect } from 'react';
import { useWebVitalsReport, setupErrorMonitoring } from '@/lib/monitoring';

export default function MonitoringProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 初始化 Web Vitals 报告
  useWebVitalsReport();

  useEffect(() => {
    // 设置错误监控
    setupErrorMonitoring();

    // 记录应用启动
    console.log('[Monitor] 应用启动 - 山信二手平台');

    // 性能计时开始
    if (typeof performance !== 'undefined') {
      performance.mark('app-start');
    }
  }, []);

  return <>{children}</>;
}
