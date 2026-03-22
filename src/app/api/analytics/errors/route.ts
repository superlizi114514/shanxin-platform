import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * 错误追踪 API
 *
 * 接收前端错误报告并记录日志
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { d: data } = body;

    if (!data) {
      return Response.json({ error: '缺少数据' }, { status: 400 });
    }

    // 构建错误信息
    const errorInfo: Record<string, unknown> = {
      type: data.type,
      message: data.message || data.reason,
      url: data.url,
      userAgent: data.userAgent,
      timestamp: data.timestamp,
    };

    // 添加堆栈信息
    if (data.stack) {
      errorInfo.stack = data.stack;
    }

    // 添加文件位置信息
    if (data.filename) {
      errorInfo.filename = data.filename;
      errorInfo.lineno = data.lineno;
      errorInfo.colno = data.colno;
    }

    // 记录错误日志
    logger.error('[ClientError]', undefined, errorInfo);

    // 在生产环境，可以考虑发送到外部错误追踪服务
    // 例如：Sentry, Bugsnag, Rollbar 等

    return Response.json({ success: true });
  } catch (error) {
    // 防止错误处理本身导致错误
    console.error('[Error API] 处理失败:', error);
    return Response.json({ error: '处理失败' }, { status: 500 });
  }
}
