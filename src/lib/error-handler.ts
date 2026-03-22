/**
 * 山信二手平台 - 错误追踪中间件
 *
 * 用于 API 路由的错误捕获和追踪
 * 支持 Vercel 日志集成
 */

import { logger } from './logger';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

interface ErrorHandlerOptions {
  operation?: string;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

/**
 * 统一的 API 错误响应格式
 */
export function createErrorResponse(
  error: string | ApiError,
  status: number = 500
): Response {
  const errorData: ApiError = typeof error === 'string'
    ? { message: error }
    : error;

  return Response.json(
    {
      error: errorData.message,
      code: errorData.code || 'INTERNAL_ERROR',
      details: errorData.details,
    },
    { status }
  );
}

/**
 * 包装 API 处理器，自动捕获错误
 *
 * @example
 * export const GET = withErrorHandler(async (request: Request) => {
 *   // 你的逻辑
 *   return Response.json({ data: 'hello' });
 * }, { operation: 'get-data' });
 */
export function withErrorHandler<
  T extends (request: Request, context?: unknown) => Promise<Response>
>(
  handler: T,
  options?: ErrorHandlerOptions
): T {
  return (async (request: Request, context?: unknown) => {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

    try {
      logger.info(`[${options?.operation || 'API'}] 开始处理`, {
        method: request.method,
        url: request.url,
        requestId,
        userId: options?.userId,
      });

      const response = await handler(request, context);

      const duration = Date.now() - startTime;
      logger.info(`[${options?.operation || 'API'}] 处理完成`, {
        status: response.status,
        duration: `${duration}ms`,
        requestId,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as Error;

      logger.error(`[${options?.operation || 'API'}] 处理失败`, err, {
        duration: `${duration}ms`,
        requestId,
        userId: options?.userId,
        ...options?.context,
      });

      // 判断错误类型返回合适的响应
      if (err.name === 'ValidationError') {
        return createErrorResponse({
          message: err.message,
          code: 'VALIDATION_ERROR',
        }, 400);
      }

      if (err.name === 'NotFoundError') {
        return createErrorResponse({
          message: '资源不存在',
          code: 'NOT_FOUND',
        }, 404);
      }

      if (err.name === 'UnauthorizedError') {
        return createErrorResponse({
          message: '未授权访问',
          code: 'UNAUTHORIZED',
        }, 401);
      }

      // 默认内部错误
      return createErrorResponse({
        message: process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : err.message,
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      }, 500);
    }
  }) as T;
}

/**
 * 捕获异步错误并记录日志
 */
export async function captureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    userId?: string;
    context?: Record<string, unknown>;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const err = error as Error;
    logger.error(`[${operation}] 执行失败`, err, {
      userId: options?.userId,
      ...options?.context,
    });
    return null;
  }
}

/**
 * 验证数据格式，失败时抛出 ValidationError
 */
export function validate<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage: string
): T {
  if (!validator(data)) {
    const error = new Error(errorMessage);
    error.name = 'ValidationError';
    throw error;
  }
  return data;
}

export class ApiErrorClass extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      details?: unknown;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status || 500;
    this.code = options?.code || 'INTERNAL_ERROR';
    this.details = options?.details;
  }
}

export class ValidationError extends ApiErrorClass {
  constructor(message: string, details?: unknown) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiErrorClass {
  constructor(message: string = '资源不存在') {
    super(message, { status: 404, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiErrorClass {
  constructor(message: string = '未授权访问') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
    this.name = 'UnauthorizedError';
  }
}
