import { resendOTPService } from "@/lib/services/auth/resend-otp-service"
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
   
  const response = await resendOTPService();
  return response;
}