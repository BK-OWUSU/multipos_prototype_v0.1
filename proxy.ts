import { NextRequest, NextResponse } from "next/server";
import { verifyPOSTokenEdge } from "./lib/auths";
import { JwtPayload } from "./types/auth";

const POS_COOKIE_NAME = "pos_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. SKIP ASSETS
    if (pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const token = request.cookies.get(POS_COOKIE_NAME)?.value;
    const reset_pass_token = request.cookies.get(PASSWORD_RESET_COOKIE_NAME)?.value;
    let session = null;

    if (token) {
        session = (await verifyPOSTokenEdge(token)) as JwtPayload;
    }

    const urlSlug = pathname.split("/")[1];
    const routeKey = pathname.split("/")[2];
    const isTenantPath = /^\/[^/]+\/[^/]+/.test(pathname);

    console.log("Route Key:", routeKey)

    // 2. PASSWORD CHANGE ENFORCEMENT
    if (session?.needsPasswordChange) {
        const resetPath = `/${session.businessSlug}/reset-password`;
        if (pathname !== resetPath) {
            return NextResponse.redirect(new URL(resetPath, request.url));
        }
        return NextResponse.next(); // Stop here, they are where they need to be
    }

    // 3. UNAUTHORIZED / GUEST ACCESS
    const publicPaths = ["/login", "/signup", "/verify-email", "/"];
    const isPublicPath = publicPaths.includes(pathname);

    if (isTenantPath && !session) {
        // Allow access to reset-password ONLY if they have the reset cookie
        if (routeKey === "reset-password" && reset_pass_token) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (session && isPublicPath) {
        return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
    }

    // 4. TENANT ISOLATION & PERMISSIONS
    if (session && isTenantPath) {
        // Wrong Business protection
        if (urlSlug !== session.businessSlug) {
            return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
        }

        // Allow system routes (Dashboard, Profile, Reset-Password) for everyone with a session
        const systemRoutes = ["dashboard", "profile", "reset-password"];
        if (systemRoutes.includes(routeKey)) {
            return NextResponse.next();
        }

        // Check Specific Permissions (e.g., /sales, /inventory)
        const hasFullAccess = session.access.includes("*");
        const hasSpecificAccess = session.access.includes(routeKey);

        if (!hasFullAccess && !hasSpecificAccess) {
            // Redirect to dashboard if they try to access a module they don't own
            return NextResponse.redirect(new URL(`/${session.businessSlug}/dashboard`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (optional, but good for icon.png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};