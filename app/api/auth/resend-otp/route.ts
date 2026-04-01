// app/api/auth/resend-otp/route.ts
import { prisma } from "@/lib/dbHelper"
import { saveOTP, generateOTP } from "@/lib/otp"
import { sendOTPEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { VERIFY_COOKIE_NAME, verifyEmailVerificationToken } from "@/lib/auths"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const verify_token = cookieStore.get(VERIFY_COOKIE_NAME)?.value;
    if (!verify_token) {
        return NextResponse.json({ error: "Unauthorized" },{ status: 401 })
    } 
    const decode = verifyEmailVerificationToken(verify_token) || null;
    if (!decode) {
        return NextResponse.json({ error: "Invalid or expired verification session" },{ status: 401 });
    }
    const {userId, email} = decode; 
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" },{ status: 401 })
    }
    console.log("Resend OTP request for userId: ", userId)
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    // Check if user found
    if (!user) {
      return NextResponse.json({ error: "User not found" },{ status: 404 })
    }
    // Check if email matches
    if (user.email !== email) {
      return NextResponse.json({error: "Invalid verification session" },{status: 401});
    }

    // Already verified
    if (user.isVerified) {
      return NextResponse.json({ error: "Email already verified" },{ status: 400 })
    }

    // Generate and save new OTP
    const code = await prisma.$transaction(async(transact) => {
      const otp = generateOTP()
      await saveOTP(user.id, otp, transact)
      return otp;
    })

    console.log("New OTP generated: ", code)
    console.log("Sending OTP email to: ", user)
    console.log("Email content: ", `Hello ${user.firstName}, your new OTP code is: ${code}`)
    // Send new OTP email
      try {
        await sendOTPEmail(
            user.email,
            user.firstName,
            code
        );
      } catch (emailError) {
        console.error("Error sending OTP email: ", emailError)
        return NextResponse.json({ error: "Failed to send OTP email. Please try again later." },{ status: 500 })
       }
    return NextResponse.json({ success: true, message: "New OTP sent to your email" },{status: 200 })
  } catch (error) {
    console.error("Resend OTP error:", error)
    return NextResponse.json({ error: "Internal Server Error" },{ status: 500 })
  }
}
