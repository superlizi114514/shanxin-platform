/**
 * 山信二手平台 - 日志工具
 *
 * 提供统一的日志记录功能，支持不同级别和格式化输出
 * 适配 Vercel 部署环境的日志最佳实践
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  requestId?: string;
  userId?: string;
}

class Logger {
  private defaultContext: LogContext = {};

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, requestId, userId } = entry;

    // Vercel 和结构化日志使用 JSON 格式
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        message,
        service: 'shanxin-platform',
        requestId,
        userId,
        ...context,
      });
    }

    // 开发环境使用彩色控制台输出
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m',  // Cyan
      info: '\x1b[32m',   // Green
      warn: '\x1b[33m',   // Yellow
      error: '\x1b[31m',  // Red
    };

    const reset = '\x1b[0m';
    const color = levelColors[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const requestStr = requestId ? ` [${requestId}]` : '';
    const userStr = userId ? ` (user:${userId})` : '';

    return `${color}[${timestamp}] [${level.toUpperCase()}]${requestStr}${userStr}: ${message}${reset}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.defaultContext, ...context },
    };

    const formattedEntry = this.formatEntry(entry);

    switch (level) {
      case 'debug':
        console.debug(formattedEntry);
        break;
      case 'info':
        console.info(formattedEntry);
        break;
      case 'warn':
        console.warn(formattedEntry);
        break;
      case 'error':
        console.error(formattedEntry);
        break;
    }
  }

  setContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  clearContext(): void {
    this.defaultContext = {};
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          stack: error.stack,
          name: error.name,
          cause: error.cause,
        }
      : context;
    this.log('error', message, errorContext);
  }

  // API 请求日志
  apiRequest(method: string, path: string, status: number, duration: number, userId?: string): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} - ${status} (${duration}ms)`, {
      method,
      path,
      status,
      duration,
      userId,
    });
  }
}

export const logger = new Logger();

// 导出便捷函数
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
};

export default logger;
