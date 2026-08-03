import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-at-least-32-characters-long"
);

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // ─── Verify JWT token ────────────────────────────────────────────────────────
  let isValid = false;
  let userRole = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isValid = true;
      userRole = payload.role;
    } catch (err) {
      isValid = false;
    }
  }

  const isAdmin = isValid && userRole === "admin";
  const isMember = isValid && userRole !== "admin";

  // ─── BLOCK /admin/register completely ───────────────────────────────────────
  // No public admin self-registration allowed
  if (pathname.startsWith("/admin/register")) {
    // Redirect to login if not logged in, to admin panel if already admin,
    // or to dashboard if a regular member somehow reaches it
    if (!isValid) return NextResponse.redirect(new URL("/login", request.url));
    if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ─── PROTECT /admin routes ───────────────────────────────────────────────────
  // Only "admin" role users may access /admin
  if (pathname.startsWith("/admin")) {
    if (!isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isAdmin) {
      // Regular users → send back to their workspace
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Admin is allowed through
    return NextResponse.next();
  }

  // ─── PROTECT /team/* routes (Team Dashboard) ──────────────────────────────────
  // Requires valid session; admins redirected to /admin, guests to /login
  // Team membership is verified client-side on the page itself
  if (pathname.startsWith("/team/")) {
    if (!isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // ─── PROTECT /dashboard and /meetings routes ─────────────────────────────────
  // Admins should NOT access the regular workspace — redirect them to /admin
  const isWorkspacePage = pathname.startsWith("/dashboard") || pathname.startsWith("/meetings");

  if (isWorkspacePage) {
    if (!isValid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAdmin) {
      // Admin has no business in the user workspace
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Regular member is allowed through
    return NextResponse.next();
  }

  // ─── AUTH pages (login / register / verify-otp) ──────────────────────────────
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify-otp");

  if (isAuthPage && isValid) {
    // Already logged in → send to correct home based on role
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/team/:path*",
    "/meetings/:path*",
    "/login",
    "/register",
    "/verify-otp",
  ],
};
