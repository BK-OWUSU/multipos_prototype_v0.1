import { getSession, POS_COOKIE_NAME, VERIFY_COOKIE_NAME } from "@/lib/auths"
import { prisma } from "@/lib/dbHelper";
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || typeof session === "string") {
            return NextResponse.json({ error: "User already logout", success: false }, { status: 401 });
    }

  const {sessionLogId} = session  

  await prisma.userSessionLog.update({
    where: {id: sessionLogId},
    data: {
      logoutAt: new Date()
    } 
  })

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