import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  const path = req.nextUrl.pathname;

  // Track overview pages (/tracks/[trackId]) are public teasers
  // Only deeper paths (lessons, lectures) and grand-project are protected
  // Domain detail pages (/domains/[domainId]) are protected
  const isTrackOverview = /^\/tracks\/[^/]+\/?$/.test(path);
  const isDomainDetail = /^\/domains\/[^/]+\/?$/.test(path);
  const isProtected =
    (path.startsWith("/tracks") && !isTrackOverview) ||
    path.startsWith("/grand-project") ||
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
  matcher: ["/tracks/:path*", "/grand-project/:path*", "/domains/:path*"],
};
