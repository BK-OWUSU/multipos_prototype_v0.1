import { NextRequest } from "next/server"
import { verifyOTPService } from "@/lib/services/auth/verify-otp-service"

export async function POST(request: NextRequest) {
  const response = await verifyOTPService(request);
  return response
}