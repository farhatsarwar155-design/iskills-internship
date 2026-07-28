import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-characters-long"
);

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  let isValid = false;
  let payload = null;
  if (token) {
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
      isValid = true;
    } catch (err) {
      isValid = false;
    }
  }

  // Allow /admin/register to be publicly accessible (must check BEFORE admin block below)
  if (pathname === "/admin/register" || pathname.startsWith("/admin/register/")) {
    return NextResponse.next();
  }

  // Strictly protect ALL /admin routes (including bare /admin):
  // Non-authenticated → /login, authenticated non-admin → /dashboard
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isValid) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }
    if (payload?.role !== "admin") {
      const url = new URL("/dashboard", request.url);
      return NextResponse.redirect(url);
    }
  }

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/verify-otp");
  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/meetings");

  if (isProtectedPage && !isValid) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && isValid) {
    const url = new URL(payload?.role === "admin" ? "/admin" : "/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // "/admin" must be listed explicitly because "/admin/:path*" only matches /admin/something, not /admin itself
  matcher: ["/dashboard/:path*", "/admin", "/admin/:path*", "/meetings/:path*", "/login", "/register", "/verify-otp"]
};
