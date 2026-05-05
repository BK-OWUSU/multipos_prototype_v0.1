import { signUp } from "@/lib/services/auth/signup-service";
import { NextRequest,  } from "next/server";

export async function POST(request: NextRequest) {
        const rawData = await request.json();
        const response = await signUp(rawData);
        return response;
}