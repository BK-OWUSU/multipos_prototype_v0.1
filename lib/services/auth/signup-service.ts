import { generateEmailVerificationToken, hashPassword, VERIFY_COOKIE_NAME } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { AccountType } from "@/lib/generated/prisma/enums";
import { generateOTP, saveOTP } from "@/lib/otp";
import { generateUniqueSlug } from "@/lib/slugGenerator";
import { NextResponse } from "next/server";

export async function signUp(businessName: string ,email: string, password: string,firstName: string,lastName: string) {
    try {

        if (!businessName || !email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: "All fields are required", success: false},{ status: 400 });
        }

        const subdomainSlug = await generateUniqueSlug(businessName); 
        const hashedPassword = await hashPassword(password);
         //Check if user already exists
        const existingEmployeeInBusiness = await prisma.employee.findFirst({
            where: {
                email: email,
                business: { slug: subdomainSlug }
            }
        });

        if (existingEmployeeInBusiness) {
            return NextResponse.json({ 
                error: "An account with this email already exists for this business name.", 
                success: false 
            }, { status: 400 });
        }
        //using transactions to register the new tenant
        const {user, otpCode, ownerEmployee} = await prisma.$transaction(async(transact)=> {
            // 1️ Creating Business
            const business = await transact.business.create({
                data : {name: businessName, slug: subdomainSlug, email}
            });
            
            // 2 Creating OWNER role
            const ownerRole = await transact.role.create({
                data: {
                    name: "OWNER",
                    permissions: ["*"],
                    access: ["*"],
                    businessId: business.id,
                    isSystem: true
                }
            });

            //Cresting admin role
            await transact.role.create({
                data: {
                    name: "ADMIN",
                    permissions: ["*"],
                    access: ["pos", "sales_terminal","transactions","invoices"],
                    businessId: business.id
                }
            });

            //Cashier Role creating
            await transact.role.create({
                data: {
                    name: "CASHIER",
                    permissions: ["sell","print"],
                    access: ["pos"],
                    businessId: business.id
                }
            });

            //Creating OWNER Employee Account
            const ownerEmployee = await transact.employee.create({
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: null,
                    roleId: ownerRole.id,
                    businessId: business.id,
                    hasSystemAccess: true, // Grant system access to OWNER
                }
            });
            // 3 Creating OWNER User Account
             const user = await transact.user.create({
                data: {
                    accountType: AccountType.OWNER,
                    password: hashedPassword,
                    employeeId: ownerEmployee.id,
                    needsPasswordChange: false
                },
            });

            // 4 Generating OPT
            const otpCode = generateOTP();
            await saveOTP(user.id, otpCode, transact);
            return { user, otpCode, ownerEmployee };
        })
        const ownerEmail = ownerEmployee.email;
        const userID = user.id;
        const userName = ownerEmployee.firstName;
        const userOtpCode = otpCode;

        const verifyToken = generateEmailVerificationToken({userId: userID, email: ownerEmail});
        const response = NextResponse.json({
            success: true, 
            message: "Registration successful. Please verify your email.",
            redirectTo: `/verify-email?email=${encodeURIComponent(ownerEmail)}`,
            }, 
            {status: 200})

        response.cookies.set(VERIFY_COOKIE_NAME, verifyToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 10 * 60, // 10 minutes
        });
    
        //Send email
        try {
        await sendOTPEmail(
            ownerEmail,
            userName,
            userOtpCode
        );
        } catch (err) {
        console.error("Email sending failed:", err);
        }
        return response;

    } catch (error) {
        console.log("Error registration: ", error)
        return NextResponse.json({error: "Error registering", success: false}, {status: 500})
    }
}