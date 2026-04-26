import { prisma } from "@/lib/dbHelper";
import { POS_COOKIE_NAME, hashPassword, PASSWORD_RESET_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Extracting the session from the POS cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(PASSWORD_RESET_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No active session found. Please log in again.", success: false }, 
        { status: 401 }
      );
    }

    // 2. Decode the token to get the User ID
    const decoded = verifyEmailVerificationToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Session expired or invalid.", success: false }, 
        { status: 401 }
      );
    }

    const { userId, businessId } = decoded;
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long.", success: false }, 
        { status: 400 }
      );
    }

    // 3. Update database using a transaction for safety
    await prisma.$transaction(async (tx) => {
      // Ensure the user actually exists and is the one flagged for change
      const user = await tx.user.findUnique({
        where: { id: userId, businessId: businessId },
        select: { businessId: true, id: true, needsPasswordChange: true }
      });

      if (!user) {
        throw new Error("User not found.");
      }

      // Security check: Only allow this if the flag is true
      if (!user.needsPasswordChange) {
        throw new Error("Password change is not required for this account.");
      }

      const hashed = await hashPassword(newPassword);

      await tx.user.update({
        where: { id: userId, businessId: businessId },
        data: {
          password: hashed,
          needsPasswordChange: false, // Clear the flag
        }
      });

      // Audit Log for the security change
      await tx.auditLog.create({
        data: {
          action: "PASSWORD_UPDATE",
          entity: "USER",
          entityId: userId,
          userId: userId,
          businessId: user.businessId,
          newValue: "Employee/Owner completed initial password setup"
        }
      });
    });

    const response = NextResponse.json({ 
      success: true, 
      message: "Password updated successfully!",
      redirectTo: "/login" 
    },
    {status: 200}
  );

    response.cookies.set(POS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  })

// Clear the cookie by setting maxAge to 0
  response.cookies.set(PASSWORD_RESET_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0
  })

  return response;

  } catch (error: unknown) {
    console.error("CHANGE_PASSWORD_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error", success: false }, 
      { status: 500 }
    );
  }
}