// app/api/auth/resend-otp/route.ts
import { prisma } from "@/lib/dbHelper"
import { saveOTP, generateOTP } from "@/lib/otp"
import { sendOTPEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateEmailVerificationToken, VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;
    if (!verify_token) {
        return NextResponse.json({ error: "Unauthorized", success: false },{ status: 401 })
    } 
    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
        return NextResponse.json({ error: "Invalid or expired verification session", success: false },{ status: 401 });
    }

    const {userId, email} = decode; 
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", success: false },{ status: 401 })
    }
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    // Check if user found
    if (!user) {
      return NextResponse.json({ error: "User not found", success: false },{ status: 404 })
    }
    // Check if email matches
    if (user.email !== email) {
      return NextResponse.json({error: "Invalid verification session", success: false },{status: 401});
    }

    // Already verified
    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified", success: false },{ status: 400 })
    }

    // Generate and save new OTP
    const results = await prisma.$transaction(async(transact) => {
      const otp = generateOTP()
      console.log("Generated OTP: ", otp)
      await saveOTP(user.id, otp, transact)
      return {code: otp, userID: user.id, userEmail: user.email}
    })

    const {code, userID, userEmail} = results;

    //Generating token for email verification
    const verifyToken = generateEmailVerificationToken({userId: userID, email: userEmail});
    const response = NextResponse.json({ success: true, message: "New OTP sent to your email" },{status: 200 })
    // Send new OTP email
      try {
        await sendOTPEmail(
            user.email,
            user.firstName,
            code
        );
      } catch (emailError) {
        console.error("Error sending OTP email: ", emailError)
        return NextResponse.json({ error: "Failed to send OTP email. Please try again later.", success: false },{ status: 500 })
       }

    response.cookies.set(VERIFY_COOKIE_NAME, verifyToken,{
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60, // 10 minutes
    })   
       
    return response;
  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json({ error: "Internal Server Error", success: false },{ status: 500 })
  }
}
