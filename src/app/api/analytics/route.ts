import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 分析数据收集 API
 *
 * 接收来自前端 Web Vitals 和错误监控数据
 * 数据发送到 Vercel Analytics 和自定义日志
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { d: data } = body;

    if (!data) {
      return Response.json({ error: '缺少数据' }, { status: 400 });
    }

    // 记录分析数据
    logger.info('[Analytics] 收到数据', {
      type: data.type,
      name: data.name,
      value: data.value,
      page: data.page,
    });

    // 根据数据类型处理
    if (data.type === 'pageview') {
      logger.info('[PageView]', {
        path: data.path,
        url: data.url,
        referrer: data.referrer,
      });
    } else if (data.type === 'action') {
      logger.info('[UserAction]', {
        action: data.action,
        ...data,
      });
    } else if (data.name) {
      // Web Vitals 指标
      logger.info('[WebVitals]', {
        name: data.name,
        value: data.value,
        id: data.id,
        page: data.page,
      });
    }

    // 在生产环境，可以考虑将数据发送到外部监控服务
    // 例如：Sentry, LogRocket, Datadog 等

    return Response.json({ success: true });
  } catch (error) {
    logger.error('[Analytics] 处理失败', error as Error);
    return Response.json({ error: '处理失败' }, { status: 500 });
  }
}
