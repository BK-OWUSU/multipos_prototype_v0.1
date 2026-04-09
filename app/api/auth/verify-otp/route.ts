// app/api/auth/verify-email/route.ts
import { prisma } from "@/lib/dbHelper"
import { verifyOTP } from "@/lib/otp"
import { generatePOSToken, POS_COOKIE_NAME, VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { JwtPayload } from "@/types/auth"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;
  const { code } = await request.json();
  try {
    if (!verify_token) {
      return NextResponse.json({ error: "Unauthorized or expired verification session",success: false },{ status: 401 })
    } 
    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
      return NextResponse.json({ error: "Invalid or expired verification session",success: false },{ status: 401 });
    }
    const {userId, email} = decode; 
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true, role: true }
    })
    if (!user) {
      return NextResponse.json({ error: "User not found",success: false },{ status: 404 })
    }
    // Check if email matches
    if (user.email !== email) {
      return NextResponse.json({error: "Invalid verification session",success: false },{status: 401});
    }
    // Already verified
    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified",success: false },{ status: 400 })
    }
    
    // Verify OTP
    const result = await verifyOTP(userId, code)
    if (!result.valid) {
      return NextResponse.json({ error: result.message, success: false },{ status: 400 })
    }
    // Mark user as verified
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    })

    // Checking if password needs to be changed before finalizing the session
    if (user.needsPasswordChange) {
      const response = NextResponse.json(
        {
          error: "Email verified. Please change your password to continue.",
          success: false,
          requiresPasswordChange: true, 
          redirectTo: `/${user.business.slug}/reset-password`,
        },
        { status: 403 }
      );

      // We still clear the verification cookie
      response.cookies.set(VERIFY_COOKIE_NAME, "", {
        httpOnly: true,
        expires: new Date(0),
      });
      return response;
    }
    // Session token object
     const token_object = {
                userId: user.id,
                businessId: user.businessId,
                businessSlug: user.business.slug,
                roleName: user.role.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                access: user.role.access,
                needsPasswordChange: user.needsPasswordChange
          } as JwtPayload;
    // Generate token and log user in
    const token = generatePOSToken(token_object)

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        businessesSlug: user.business.slug
      },
      { status: 200 }
    )
    //Setting login cookie
    response.cookies.set(POS_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60
    })

    // Clear verification token cookie
    response.cookies.set(VERIFY_COOKIE_NAME, "", {
      httpOnly: true,
      expires: new Date(0),
    });
    
    return response

  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", success: false },
      { status: 500 }
    )
  }
}