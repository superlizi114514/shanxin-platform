import { NextRequest, NextResponse } from "next/server";

// 速率限制配置
export interface RateLimitConfig {
  interval: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
}

// 速率限制存储（生产环境应使用 Redis 或其他存储）
interface RateLimitData {
  count: number;
  resetTime: number;
}

// 内存存储（开发环境使用）
const store = new Map<string, RateLimitData>();

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  interval: 60 * 1000, // 1 分钟
  maxRequests: 10, // 10 次请求
};

// 不同 API 端点的速率限制配置
export const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  // 认证端点 - 更严格的限制
  "/api/auth/login": { interval: 60 * 1000, maxRequests: 5 }, // 5 次/分钟
  "/api/auth/register": { interval: 60 * 1000, maxRequests: 3 }, // 3 次/分钟
  "/api/auth/forgot-password": { interval: 60 * 1000, maxRequests: 3 },
  "/api/auth/reset-password": { interval: 60 * 1000, maxRequests: 3 },

  // 消息端点 - 中等限制
  "/api/messages": { interval: 60 * 1000, maxRequests: 30 },

  // 上传端点 - 严格限制
  "/api/upload": { interval: 60 * 1000, maxRequests: 10 },

  // 搜索端点 - 中等限制
  "/api/products": { interval: 1000, maxRequests: 100 },

  // 默认配置
  default: { interval: 1000, maxRequests: 100 },
};

/**
 * 获取客户端标识（IP 地址）
 */
function getClientIdentifier(request: NextRequest): string {
  // 尝试从请求头获取真实 IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // 回退到直接连接 IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0];
  return ip || "unknown";
}

/**
 * 检查并更新速率限制
 */
export async function checkRateLimit(
  request: NextRequest,
  endpoint?: string
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const config = endpoint
    ? ENDPOINT_CONFIGS[endpoint] || ENDPOINT_CONFIGS.default
    : ENDPOINT_CONFIGS.default;

  const clientId = getClientIdentifier(request);
  const key = `${clientId}:${endpoint || "default"}`;
  const now = Date.now();

  const record = store.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!record || now > record.resetTime) {
    const newRecord: RateLimitData = {
      count: 1,
      resetTime: now + config.interval,
    };
    store.set(key, newRecord);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // 检查是否超过限制
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // 更新计数
  record.count++;
  store.set(key, record);

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 速率限制中间件包装器
 */
export function withRateLimit<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  endpoint?: string
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;

    const result = await checkRateLimit(request, endpoint);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": ENDPOINT_CONFIGS[endpoint || "default"]
              .maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 添加速率限制头到响应
    const response = await handler(...args);

    response.headers.set("X-RateLimit-Limit", ENDPOINT_CONFIGS[endpoint || "default"].maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

    return response;
  }) as T;
}

/**
 * 清理过期的速率限制记录
 * 建议每 10 分钟调用一次
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (now > data.resetTime) {
      store.delete(key);
    }
  }
}

// 定期清理（开发环境）
if (process.env.NODE_ENV === "development") {
  setInterval(cleanupExpiredRecords, 10 * 60 * 1000);
}
