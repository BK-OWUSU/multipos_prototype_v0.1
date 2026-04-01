import { POS_COOKIE_NAME, VERIFY_COOKIE_NAME } from "@/lib/auths"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    {success: true, message: "Logged out successfully" },
    { status: 200 }
  )

  // Clear the cookie by setting maxAge to 0
  response.cookies.set(POS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  })

// Clear the cookie by setting maxAge to 0
  response.cookies.set(VERIFY_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  })

  return response
}