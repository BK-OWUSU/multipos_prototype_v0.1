import { generateEmailVerificationToken, hashPassword, VERIFY_COOKIE_NAME } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, saveOTP } from "@/lib/otp";
import { generateUniqueSlug } from "@/lib/slugGenerator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const {businessName,email,password,firstName,lastName} = await request.json();
        if (!businessName || !email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: "All fields are required"},{ status: 400 });
        }

        //  //Check if user already exists
        // const existingUser = await prisma.user.findFirst({
        // where: { email },
        // });

        // if (existingUser) {
        // return NextResponse.json(
        //     { error: "User already exists" },
        //     { status: 400 }
        // );}

        const slug = await generateUniqueSlug(businessName); 
        const hashedPassword = await hashPassword(password);

        //using transactions to register the new tenant
        const result = await prisma.$transaction(async(transact)=> {
            // 1️ Creating Business
            const business = await transact.business.create({
                data : {name: businessName,slug,email}
            });
            
            // 2 Creating OWNER role
            const ownerRole = await transact.role.create({
                data: {
                    name: "OWNER",
                    permissions: ["*"],
                    access: ["*"],
                    businessId: business.id
                }
            });

            // 3 Creating OWNER user
             const user = await transact.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    businessId: business.id,
                    roleId: ownerRole.id,
                },
            });

            // 4 Generating OPT
            const otpCode = generateOTP();
            await saveOTP(user.id, otpCode, transact);
            return { user, business, otpCode };

        })
        const userEmail = result.user.email;
        const userID = result.user.id;
        const userName = result.user.firstName;
        const userOtpCode = result.otpCode;

        const verifyToken = generateEmailVerificationToken({userId: userID, email: userEmail});
        const response = NextResponse.json({
            success: true, 
            message: "Registration successful. Please verify your email.",
            redirectTo: "/verify-email",
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
            userEmail,
            userName,
            userOtpCode
        );
        } catch (err) {
        console.error("Email sending failed:", err);
        }
        return response;

    } catch (error) {
        console.log("Error registration: ", error)
        return NextResponse.json({error: "Error registering"}, {status: 401})
    }
}