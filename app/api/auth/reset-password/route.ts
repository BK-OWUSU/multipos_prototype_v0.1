import { NextRequest,  } from "next/server";
import { resetPasswordService } from "@/lib/services/auth/reset-password-service";

export async function POST(request: NextRequest) {
   const response = await resetPasswordService(request)
   return response;
  }