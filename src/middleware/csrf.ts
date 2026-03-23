import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

/**
 * CSRF 保护中间件
 *
 * 实现双重提交 Cookie 模式防止 CSRF 攻击
 * 参考：https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

// CSRF Cookie 名称
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

// 不需要 CSRF 保护的方法
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * 生成 CSRF 令牌
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 哈希 CSRF 令牌（用于存储到 cookie）
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 从 Cookie 获取 CSRF 令牌
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  const cookieStore = request.cookies;
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  return token || null;
}

/**
 * 从请求头获取 CSRF 令牌
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || null;
}

/**
 * 验证 CSRF 令牌
 *
 * 双重提交 Cookie 模式：
 * 1. 客户端从 Cookie 读取 CSRF token
 * 2. 客户端在请求头中发送相同的 token
 * 3. 服务器验证 Cookie 和 Header 中的 token 是否匹配
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // 安全方法不需要验证
  if (SAFE_METHODS.has(request.method)) {
    return true;
  }

  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  // 两者都必须存在且匹配
  if (!cookieToken || !headerToken) {
    return false;
  }

  // 比较哈希值（防止定时攻击）
  const hashedCookie = hashToken(cookieToken);
  const hashedHeader = hashToken(headerToken);

  return hashedCookie === hashedHeader;
}

/**
 * 设置 CSRF Cookie
 *
 * 应在响应中设置 CSRF cookie 供客户端使用
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // 需要让 JavaScript 可以读取
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });
}

/**
 * CSRF 保护中间件包装器
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;

    // 验证 CSRF token
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        {
          error: "CSRF token missing or invalid",
          message: "The request could not be verified. Please try again.",
        },
        { status: 403 }
      );
    }

    return handler(...args);
  }) as T;
}

/**
 * 获取新的 CSRF Token 并设置 Cookie
 *
 * 用于初次访问或 token 过期时
 */
export async function getCsrfToken(request?: NextRequest): Promise<{
  token: string;
  cookie?: string;
}> {
  const token = generateCsrfToken();

  if (request) {
    // 如果已有有效的 cookie，返回现有的 token
    const existingToken = getCsrfTokenFromCookie(request);
    if (existingToken) {
      return { token: existingToken };
    }
  }

  return { token };
}

/**
 * API 路由：获取 CSRF Token
 *
 * GET /api/csrf-token
 */
export async function GET(request: NextRequest) {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  setCsrfCookie(response, token);
  return response;
}
