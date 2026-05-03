import { prisma } from "@/lib/dbHelper"
import { verifyOTP } from "@/lib/otp"
import { generatePOSToken, POS_COOKIE_NAME, VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { JwtPayload } from "@/types/auth"

export async function verifyOTPService(request: NextRequest) {
  const cookieStore = await cookies();
  const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;
  const { code } = await request.json();
  
  try {
    if (!verify_token) {
      return NextResponse.json({ error: "Unauthorized or expired verification session", success: false }, { status: 401 })
    } 

    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
      return NextResponse.json({ error: "Invalid or expired verification session", success: false }, { status: 401 });
    }

    const { userId, email: tokenEmail } = decode; 

    // 1. Fetch user including the nested employee profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        employee: {
          include: { business: true, role: true }
        } 
      }
    })

    if (!user || !user.employee) {
      return NextResponse.json({ error: "Account record not found", success: false }, { status: 404 })
    }

    const emp = user.employee;

    // 2. Validate session email against the employee profile email
    if (emp.email !== tokenEmail) {
      return NextResponse.json({ error: "Invalid verification session", success: false }, { status: 401 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified", success: false }, { status: 400 })
    }
    
    // 3. Verify OTP code
    const result = await verifyOTP(userId, code)
    if (!result.valid) {
      return NextResponse.json({ error: result.message, success: false }, { status: 400 })
    }

    // 4. Mark as verified in DB
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    })

    // 5. Handle initial password change requirement
    if (user.needsPasswordChange) {
      const response = NextResponse.json(
        {
          message: "Email verified. Please change your password to continue.",
          success: true,
          requiresPasswordChange: true, 
          redirectTo: `/${emp.business.slug}/reset-password`,
        },
        { status: 200 }
      );

      // Clear verification cookie so they can't reuse the OTP screen
      response.cookies.set(VERIFY_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0) });
      return response;
    }

    // 6. Generate the final Session Token (Include employeeId and businessId)
    const token_object: JwtPayload = {
        userId: user.id,
        employeeId: emp.id,
        businessId: emp.businessId,
        businessSlug: emp.business.slug,
        roleName: emp.role.name,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        access: emp.role.access,
        needsPasswordChange: user.needsPasswordChange
    };

    const token = generatePOSToken(token_object)

    const response = NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        businessSlug: emp.business.slug,
        redirectTo: `/${emp.business.slug}/dashboard`
      },
      { status: 200 }
    )

    // 7. Set the POS session cookie (8-hour shift duration)
    response.cookies.set(POS_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 60 
    })

    // Clear verification session
    response.cookies.set(VERIFY_COOKIE_NAME, "", { httpOnly: true, expires: new Date(0) });
    
    return response

  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", success: false },
      { status: 500 }
    )
  }
}