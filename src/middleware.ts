import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

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
  "/admin",
];

// Routes that should redirect to home if user is logged in
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default auth(async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Get session from NextAuth
  const session = await auth();
  const isLoggedIn = !!session?.user;

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

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
