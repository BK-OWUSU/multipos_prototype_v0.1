import { signUp } from "@/lib/services/auth/signup-service";
import { NextRequest,  } from "next/server";

export async function POST(request: NextRequest) {
        const {businessName,email,password,firstName,lastName} = await request.json();
        const response = await signUp(businessName, email, password, firstName, lastName);
        return response;
}