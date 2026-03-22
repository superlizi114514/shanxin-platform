import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/products",
  "/products/new",
  "/schedule",
  "/merchants",
  "/orders",
  "/messages",
  "/collections",
  "/profile",
];

// Routes that should redirect to home if user is logged in
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const startTime = Date.now();

  // 生成请求 ID 用于追踪
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const responseHeaders = new Headers(req.headers);
  responseHeaders.set('x-request-id', requestId);

  // 记录请求开始（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${req.method} ${pathname} [${requestId}]`);
  }

  // Check if trying to access protected route while not logged in
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if trying to access auth route while already logged in
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing auth route while logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  const response = NextResponse.next();

  // 添加请求 ID 到响应头
  response.headers.set('x-request-id', requestId);

  // 记录请求耗时（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - startTime;
    console.log(`[Middleware] 完成 ${pathname} - ${duration}ms [${requestId}]`);
  }

  return response;
});

// Matcher to determine which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
