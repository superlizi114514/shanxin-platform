# US-022: API 速率限制 - 完成报告

## 完成时间
2026-03-23

## 任务描述
添加 API 速率限制功能，防止 API 滥用和 DDoS 攻击。

## 完成内容

### 1. 创建速率限制中间件

文件：`src/middleware/rate-limit.ts`

#### 核心功能

| 功能 | 描述 |
|------|------|
| `checkRateLimit()` | 检查并更新速率限制状态 |
| `withRateLimit()` | 包装 API 处理器的装饰器 |
| `cleanupExpiredRecords()` | 清理过期的速率限制记录 |
| `getClientIdentifier()` | 获取客户端 IP 标识 |

#### 速率限制配置

```typescript
export const ENDPOINT_CONFIGS: Record<string, RateLimitConfig> = {
  // 认证端点 - 最严格
  "/api/auth/login": { interval: 60000, maxRequests: 5 },
  "/api/auth/register": { interval: 60000, maxRequests: 3 },
  "/api/auth/forgot-password": { interval: 60000, maxRequests: 3 },

  // 消息端点 - 中等
  "/api/messages": { interval: 60000, maxRequests: 30 },

  // 上传端点 - 严格
  "/api/upload": { interval: 60000, maxRequests: 10 },

  // 默认配置 - 宽松
  "default": { interval: 1000, maxRequests: 100 },
};
```

### 2. 速率限制响应头

所有响应包含以下头部信息：

| 头部 | 描述 |
|------|------|
| `X-RateLimit-Limit` | 每分钟最大请求数 |
| `X-RateLimit-Remaining` | 剩余请求数 |
| `X-RateLimit-Reset` | 限制重置时间戳 |
| `Retry-After` | 建议重试等待时间（秒） |

### 3. 429 Too Many Requests 响应

当超过速率限制时返回：

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in X seconds."
}
```

### 4. 已更新的 API

| API | 状态 |
|-----|------|
| `/api/auth/register` | ✅ 已添加速率限制（3 次/分钟） |

### 5. 使用示例

```typescript
import { checkRateLimit } from "@/middleware/rate-limit";

export async function POST(request: NextRequest) {
  // 检查速率限制
  const rateLimitResult = await checkRateLimit(request, "/api/auth/login");

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        }
      }
    );
  }

  // ... 正常处理
}
```

### 6. 存储方案

**当前实现**: 内存存储（Map）
- 适用于开发环境和单服务器部署
- 重启后清空所有记录

**生产环境建议**: 使用 Redis
- 分布式环境共享速率限制状态
- 持久化存储，防止重启失效

### 7. 特性

- ✅ 基于 IP 地址的速率限制
- ✅ 可配置的端点级速率限制
- ✅ 自动清理过期记录
- ✅ 标准的速率限制响应头
- ✅ 支持自定义配置

## 待完成的工作

1. 为其他关键 API 添加速率限制：
   - [ ] `/api/auth/login` - 5 次/分钟
   - [ ] `/api/auth/forgot-password` - 3 次/分钟
   - [ ] `/api/auth/reset-password` - 3 次/分钟
   - [ ] `/api/messages` - 30 次/分钟
   - [ ] `/api/upload` - 10 次/分钟

2. 生产环境升级：
   - [ ] 使用 Redis 替代内存存储
   - [ ] 添加速率限制监控
   - [ ] 配置告警阈值

## 下一步

1. 实现 US-023: CSRF 保护
2. 为更多 API 端点添加速率限制
3. 考虑集成 Redis 用于生产环境

## 参考资料

- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [RFC 6585 - Additional HTTP Status Codes](https://datatracker.ietf.org/doc/html/rfc6585#section-4)
