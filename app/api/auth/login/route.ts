import { login } from "@/lib/services/auth/login-service";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    const ipAddress =request.headers.get("x-forwarded-for") ||request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const response  = await login(email,password, ipAddress, userAgent);
    
    console.log(ipAddress);
    console.log(userAgent);
    return response;
}