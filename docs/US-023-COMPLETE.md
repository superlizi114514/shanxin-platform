# US-023: CSRF 保护 - 完成报告

## 完成时间
2026-03-23

## 任务描述
添加 CSRF（跨站请求伪造）保护机制，防止恶意网站伪造用户请求。

## 完成内容

### 1. 创建 CSRF 中间件

文件：`src/middleware/csrf.ts`

#### 核心功能

| 功能 | 描述 |
|------|------|
| `generateCsrfToken()` | 生成随机 CSRF 令牌 |
| `validateCsrfToken()` | 验证请求中的 CSRF 令牌 |
| `setCsrfCookie()` | 设置 CSRF Cookie |
| `getCsrfTokenFromCookie()` | 从 Cookie 获取令牌 |
| `getCsrfTokenFromHeader()` | 从请求头获取令牌 |
| `withCsrfProtection()` | API 包装器装饰器 |

#### 实现模式

采用 **双重提交 Cookie 模式** (Double Submit Cookie Pattern)：

1. 服务器生成随机 CSRF token 并设置到 Cookie
2. 客户端 JavaScript 读取 Cookie 中的 token
3. 客户端在修改数据的请求中添加 `X-CSRF-Token` 头部
4. 服务器验证 Cookie 和 Header 中的 token 是否匹配

### 2. CSRF Token API

**端点**: `GET /api/csrf-token`

**响应**:
```json
{
  "csrfToken": "a1b2c3d4e5f6g7h8i9j0..."
}
```

**Cookie 设置**:
- 名称：`csrf_token`
- HttpOnly: `false` (需要让 JavaScript 读取)
- Secure: `true` (仅生产环境)
- SameSite: `strict`
- 有效期：7 天

### 3. 已保护的 API

| API | 方法 | 状态 |
|-----|------|------|
| `/api/orders` | POST | ✅ 已保护 |
| `/api/csrf-token` | GET | ✅ Token 获取端点 |

### 4. 受保护的方法

CSRF 保护仅应用于修改数据的 HTTP 方法：

- ❌ GET - 不保护（只读操作）
- ❌ HEAD - 不保护（元数据请求）
- ❌ OPTIONS - 不保护（预检请求）
- ✅ POST - 需要保护（创建资源）
- ✅ PUT - 需要保护（更新资源）
- ✅ PATCH - 需要保护（部分更新）
- ✅ DELETE - 需要保护（删除资源）

### 5. 客户端使用示例

```typescript
// 1. 页面加载时获取 CSRF token
async function initCsrf() {
  const response = await fetch('/api/csrf-token');
  const { csrfToken } = await response.json();
  return csrfToken;
}

// 2. 在修改数据的请求中包含 CSRF token
async function createOrder(orderData) {
  const csrfToken = await initCsrf();

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify(orderData),
  });

  if (response.status === 403) {
    // CSRF token 无效，可能需要刷新 token
    console.error('CSRF validation failed');
  }

  return response.json();
}
```

### 6. Next.js 组件示例

```typescript
'use client';

import { useEffect, useState } from 'react';

export function OrderForm() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    // 获取 CSRF token
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ /* order data */ }),
    });

    if (!response.ok) {
      // 处理错误
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

### 7. 错误响应

当 CSRF 验证失败时返回：

```json
{
  "error": "CSRF token missing or invalid",
  "message": "The request could not be verified. Please try again."
}
```

HTTP 状态码：`403 Forbidden`

### 8. 安全特性

- ✅ 双重提交 Cookie 模式
- ✅ SHA-256 哈希比较（防止定时攻击）
- ✅ SameSite=strict Cookie 属性
- ✅ Secure Cookie（生产环境）
- ✅ 随机令牌生成（32 字节 = 256 位）
- ✅ 仅保护修改数据的方法

## 待完成的工作

1. 为更多敏感 API 添加 CSRF 保护：
   - [ ] `/api/auth/register` - 注册
   - [ ] `/api/auth/login` - 登录
   - [ ] `/api/auth/forgot-password` - 忘记密码
   - [ ] `/api/auth/reset-password` - 重置密码
   - [ ] `/api/messages` - 发送消息
   - [ ] `/api/products` (POST/PUT/DELETE) - 商品操作
   - [ ] `/api/collections` (POST/DELETE) - 收藏操作

2. 前端集成：
   - [ ] 创建全局 CSRF token 管理
   - [ ] 添加到 API 客户端封装
   - [ ] 自动刷新过期 token

## 下一步

1. 完成 AGENT_4 文档中的其他任务
2. 扩展到更多 API 端点
3. 添加前端自动 token 管理

## 参考资料

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Guide](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [RFC 6265 - HTTP State Management Mechanism](https://datatracker.ietf.org/doc/html/rfc6265)
