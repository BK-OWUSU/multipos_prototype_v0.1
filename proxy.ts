import { NextRequest, NextResponse } from "next/server";
import { verifyPOSTokenEdge } from "./lib/auths";
import { JwtPayload } from "./types/auth";

const POS_COOKIE_NAME = "pos_token";
export async function proxy(request: NextRequest ) {
    const { pathname } = request.nextUrl;
    // 1. SKIP STATIC FILES & ASSETS
    if (
      pathname.startsWith('/_next') || 
      pathname.includes('.') ||
      pathname.startsWith('/api')
    ) {
      return NextResponse.next();
    }
    const token = request.cookies.get(POS_COOKIE_NAME)?.value;

  // 2. CHECK PUBLIC PATHS
  const publicPaths = ["/login", "/signup", "/verify-email", "/"];
  const isPublicPath = publicPaths.includes(pathname);

  // 3. CHECK PROTECTED PATHS
  // Since this is a Multi-tenant POS, anything with a slug /[slug]/... is protected
  const isProtectedPath = /^\/[^/]+\/.+/.test(pathname);

  console.log(`Path: ${pathname} | Public: ${isPublicPath} | Protected: ${isProtectedPath}`);

  let session = null;

  // Decode token (Edge safe)
  if (token) {
    session = await verifyPOSTokenEdge(token) as JwtPayload;
    console.log("Decoded session from token: ", session);
  }

  // No token → block protected routes
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Logged in user trying to access public pages
  if (session && isPublicPath) {
    return NextResponse.redirect(
      new URL(`/${session.businessSlug}/dashboard`, request.url)
    );
  }

  // 🔐 3. MULTI-TENANT PROTECTION (VERY IMPORTANT)
  if (session && isProtectedPath) {
    const urlSlug = pathname.split("/")[1];
    console.log(`URL Slug: ${urlSlug} | Session Business Slug: ${session.businessSlug}`);

    // User trying to access another tenant
    if (urlSlug !== session.businessSlug) {
      return NextResponse.redirect(
        new URL(`/${session.businessSlug}/dashboard`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/verify-otp",
    "/:slug/:path*",
  ],
};