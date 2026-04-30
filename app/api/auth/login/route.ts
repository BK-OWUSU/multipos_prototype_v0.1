import { login } from "@/lib/services/auth/login-service";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();
    const response  = await login(email,password);
    return response;
}