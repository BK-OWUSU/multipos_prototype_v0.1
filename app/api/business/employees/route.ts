import { hashPassword, POS_COOKIE_NAME, verifyPOSToken } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendTempPasswordEmail } from "@/lib/email";
import { generateRandomPassword } from "@/lib/utils";
import { createEmployeeSchema } from "@/schema/auth.schema";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";



export async function POST(request: NextRequest) {
    try {
        // 1. Get and verify the session cookie
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized session", success: false }, { status: 401 });
        } 
        // Decode the token
        const decoded = verifyPOSToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid or expired session", success: false }, { status: 401 });
        }
        const { userId, businessId } = decoded;
        const body = await request.json();
        const validatedData = createEmployeeSchema.parse(body);

        //Checking id user already exist or not
        const existingUser = await prisma.user.findFirst({
            where: {
                email: validatedData.email,
                businessId: businessId
            }
        });
        if (existingUser) {
            return NextResponse.json(
                { error: "An employee with this email is already registered in your business.", success: false },
                { status: 400 }
            );
        }

        // 1. Generate temp password
        const tempPassword = generateRandomPassword();
        const hashTempPassword = await hashPassword(tempPassword);
        //using transaction to save use details
        const results = await prisma.$transaction(async(transact)=> {
            //Creating user
            const newEmployee = await transact.user.create({
                data: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    email: validatedData.email,
                    phone: validatedData.phone,
                    roleId: validatedData.roleId,
                    shopId: validatedData.shopId || null,
                    password: hashTempPassword,
                    businessId: businessId,
                    isVerified: false, 
                    needsPasswordChange: true,
                }
            });

            //Creating audit logs
            await transact.auditLog.create({
                data: {
                    action: "CREATE_EMPLOYEE",
                    entity: "USER",
                    entityId: newEmployee.id,
                    userId: userId,
                    businessId: businessId,
                }
            })

            //Getting business slug
            const business = await transact.business.findUnique({
                 where: { id: businessId } 
            });

            // Handling case where business somehow isn't found
            if (!business) throw new Error("Business not found");

            return {newEmployee, business};
        }); // End of transaction

        const {newEmployee, business} = results;
        console.log(
            `Name:  ${newEmployee.firstName} || Email:  ${newEmployee.email} || Password: ${tempPassword}`)
        // 2. Send email
        try {
            await sendTempPasswordEmail(
                newEmployee.email, 
                tempPassword, 
                newEmployee.firstName,
                business.slug
            );   
        } catch (err) {
            console.error("Email sending failed:", err);
        }

        return NextResponse.json(
            { success: true, message: `Employee ${newEmployee.firstName} created and email sent` },
            {status: 200}
        );

    } catch (error: unknown) {
        console.error("Employee registration error:", error);
    }

    return NextResponse.json(
      { error: "Internal Server Error", success: false },
      { status: 500 }
    );
}

export async function GET(request: NextRequest) {
    try {
        // 1. Verify the session
        const cookieStore = await cookies();
        const token = cookieStore.get(POS_COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
        }

        const decoded = verifyPOSToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid session", success: false }, { status: 401 });
        }

        const { businessId } = decoded;

        // 2. Fetch employees with relations
        const employees = await prisma.user.findMany({
            where: {
                businessId: businessId,
                NOT: {
                    id: decoded.userId
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
