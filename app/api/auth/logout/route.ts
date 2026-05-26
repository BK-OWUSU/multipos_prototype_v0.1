import { getSession, POS_COOKIE_NAME, VERIFY_COOKIE_NAME } from "@/lib/auths"
import { LogoutService } from "@/lib/services/auth/logout-service";
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || typeof session === "string") {
    return NextResponse.json({ error: "User already logout", success: false }, { status: 401 });
  }
  const response = await LogoutService.logout(session);
  if (response.status && response.success) {
        const res = NextResponse.json({success: true, message: "Logged out successfully" },{ status: 200 })

        // Clear the cookie by setting maxAge to 0
        res.cookies.set(POS_COOKIE_NAME, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 0
        })

      // Clear the cookie by setting maxAge to 0
        res.cookies.set(VERIFY_COOKIE_NAME, "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 0
        })

        return res;
    } else {
        return NextResponse.json({ error: response.error, success: false }, { status: response.status || 500 });
    }
  }