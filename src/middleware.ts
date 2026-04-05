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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires auth
  const needsAuth = authRequiredPaths.some((p) => pathname.startsWith(p));
  const needsEnterprise = enterpriseAdminPaths.some((p) =>
    pathname.startsWith(p)
  );

  if (!needsAuth && !needsEnterprise) {
    return NextResponse.next();
  }

  const user = await getTokenPayload(request);

  if (!user) {
    // API routes return 401, page routes redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsEnterprise && user.role !== "enterprise_admin" && user.role !== "platform_admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/enterprise/:path*",
    "/api/progress/:path*",
    "/api/enrollments/:path*",
    "/api/profile/:path*",
    "/api/organizations/:path*",
  ],
};
