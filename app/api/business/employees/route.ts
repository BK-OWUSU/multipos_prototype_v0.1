import { getSession, hashPassword } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
// import { sendTempPasswordEmail } from "@/lib/email";
import { AccountType } from "@/lib/generated/prisma/enums";
import { createEmployee, getAllEmployeesService } from "@/lib/services/business/employee-services";
// import { generateRandomPassword } from "@/lib/utils";
// import { createEmployeeSchema } from "@/schema/auth.schema";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {
    // try {
        //Getting current user session
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Invalid or expired session", success: false }, { status: 401 });
        }
        const { userId, businessId } = session;
        
        const response = await createEmployee(request, userId, businessId)

        if (response.success && response.message) {
            return NextResponse.json({success: response.success, message: response.message}, {status: response.status})
        }else {
            return NextResponse.json({success: response.success, error: response.error}, {status: response.status})
        }
}

export async function GET(request: NextRequest) {
    const session = await getSession();
    
    if (!session || typeof session === "string") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {businessId, userId, employeeId} = session;

    // Call the service with params from session
    const result = await getAllEmployeesService(businessId, userId, employeeId || "");

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
}