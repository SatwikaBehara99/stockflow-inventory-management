import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const session = token ? await verifyToken(token) : null;
  const isAuthenticated = !!session;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isDashboardPage = pathname.startsWith("/dashboard");

  // 1. If trying to access protected dashboard without authentication -> redirect to /login
  if (isDashboardPage && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If already logged in and visiting login or register -> redirect to /dashboard
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     * - api routes (they perform independent JWT validation)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
  ],
};

