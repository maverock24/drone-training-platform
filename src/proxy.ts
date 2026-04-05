import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

async function getTokenPayload(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: (payload.role as string) || "student",
    };
  } catch {
    return null;
  }
}

// Routes that require authentication
const authRequiredPaths = ["/dashboard", "/api/progress", "/api/enrollments", "/api/profile"];

// Routes that require enterprise_admin role
const enterpriseAdminPaths = ["/enterprise", "/api/organizations"];

export async function proxy(req: NextRequest) {
  // In local development, bypass auth checks entirely
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const path = req.nextUrl.pathname;
  const user = await getTokenPayload(req);

  // ── RBAC: auth-required routes ──
  const needsAuth = authRequiredPaths.some((p) => path.startsWith(p));
  const needsEnterprise = enterpriseAdminPaths.some((p) => path.startsWith(p));

  if (needsAuth || needsEnterprise) {
    if (!user) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("returnTo", path);
      return NextResponse.redirect(loginUrl);
    }

    if (needsEnterprise && user.role !== "enterprise_admin" && user.role !== "platform_admin") {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // ── Legacy content gating ──
  const token = req.cookies.get("session")?.value;

  // Track overview pages (/tracks/[trackId]) are public teasers
  // Only deeper paths (lessons, lectures) and grand-project are protected
  // Domain detail pages (/domains/[domainId]) are protected
  const isTrackOverview = /^\/tracks\/[^/]+\/?$/.test(path);
  const isDomainDetail = /^\/domains\/[^/]+\/?$/.test(path);
  const isProtected =
    (path.startsWith("/tracks") && !isTrackOverview) ||
    path.startsWith("/grand-project") ||
    path === "/profile" ||
    isDomainDetail;

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      // Invalid/expired token — clear it and redirect to login for protected routes
      if (isProtected) {
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.set("session", "", { expires: new Date(0) });
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tracks/:path*",
    "/grand-project/:path*",
    "/domains/:path*",
    "/profile",
    "/dashboard/:path*",
    "/enterprise/:path*",
    "/api/progress/:path*",
    "/api/enrollments/:path*",
    "/api/profile/:path*",
    "/api/organizations/:path*",
  ],
};
