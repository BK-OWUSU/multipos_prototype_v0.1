import { getSession, hashPassword } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
// import { sendTempPasswordEmail } from "@/lib/email";
import { AccountType } from "@/lib/generated/prisma/enums";
import { createEmployee } from "@/lib/services/employee-services";
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
    try {
        // 1. Get current user session
        const session = await getSession();
        if (!session || typeof session === "string") {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        }
        if (!session) {
            return NextResponse.json({ error: "Invalid session", success: false }, { status: 401 });
        }

        const { businessId, userId } = session;

        // 2. Fetch employees with relations
        const employees = await prisma.user.findMany({
            where: {
                businessId: businessId,
                NOT: {
                    id: userId,
                    accountType: AccountType.OWNER
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isActive: true,
                isVerified: true,
                needsPasswordChange: true,
                createdAt: true,
                // Include specific fields from relations
                role: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
             // Newest employees first
            orderBy: {createdAt: 'desc'}
        });

        return NextResponse.json({ 
            success: true, 
            employees 
        }, { status: 200 });

    } catch (error) {
        console.error("GET_EMPLOYEES_ERROR:", error);
        return NextResponse.json({ 
            error: "Failed to fetch employees", 
            success: false 
        }, { status: 500 });
    }
}
