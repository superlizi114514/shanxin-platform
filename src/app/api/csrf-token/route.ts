import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/middleware/csrf";

/**
 * GET /api/csrf-token
 *
 * 获取 CSRF Token 并设置 Cookie
 */
export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  setCsrfCookie(response, token);
  return response;
}
