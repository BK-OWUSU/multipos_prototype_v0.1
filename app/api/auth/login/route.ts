import { POS_COOKIE_NAME, generateEmailVerificationToken, generatePOSToken, VERIFY_COOKIE_NAME, verifyPassword, PASSWORD_RESET_COOKIE_NAME } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, saveOTP } from "@/lib/otp";
import { JwtPayload } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const {email, password} = await request.json();
        console.log("Login attempt for email: ", email)
        //Check if email and password are not empty
    if (!email || !password) {
        return NextResponse.json({success: false,error: "Email and password are required"}, {status: 400});
    }
    //Find ALL users with this email (multi-tenant support)
        const users = await prisma.user.findMany({
            where: { email 
            },
            include: {
                business: true,
                role: true
            },
        })
        //Check if a user exist
        console.log("Users found: ", users.length)
        if(users.length === 0) {
            return NextResponse.json({success: false, error:"Invalid email or password"}, {status: 401})
        }
        //Check password against first user (they should all match anyway)
        const validUsers = []
        const deactivatedUsers = [];

        for (const user of users) {
            const isValidPassword = await verifyPassword(password, user.password);
            if (isValidPassword) {
                if (user.isActive) {
                    validUsers.push(user);
                } else {
                    deactivatedUsers.push(user);
                }
            }
        }

        // 2. Handle cases where no active users were found
        if (validUsers.length === 0) {
            // If the password was correct but the accounts are all deactivated
            if (deactivatedUsers.length > 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: "Your account has been deactivated. Please contact your administrator." 
                }, { status: 403 });
            }
            // Otherwise, it was just a wrong password
            return NextResponse.json({ error: "Invalid email or password", success: false }, { status: 401 });
        }


        // //Check if a user is found
        // if(validUsers.length === 0) {
        //     return NextResponse.json({error:"Invalid email or password", success: false}, {status: 401})
        // }

        //If only ONE business → login directly
        if (validUsers.length === 1) {
            const user  = validUsers[0];
            // Check if email is verified
            if (!user.isVerified) {
                const verify_token = generateEmailVerificationToken({userId: user.id, email: user.email});
                const response = NextResponse.json(
                    {error: "Please verify your email first", isVerified: false, redirectTo: "/verify-email", success: false},
                    {status: 403}
                );
                //Generate and save OTP Code
                const otpCode = await prisma.$transaction(async(tx)=> {
                    const code =  generateOTP();
                    await saveOTP(user.id, code, tx);
                    return code;
                })
                
                //Sending OTP code to email
                        try {
                        await sendOTPEmail(
                            user.email,
                            user.firstName,
                            otpCode
                        );
                        } catch (err) {
                        console.error("Email sending failed:", err);
                        }
                // Set verification token cookie
                response.cookies.set(VERIFY_COOKIE_NAME, verify_token, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 10 * 60, // 10 minutes
                });
                return response;
            }
            
            // Check if password needs to be changed for first time login users apart from OWNER
            if (user.needsPasswordChange) {
                const reset_password = generateEmailVerificationToken({
                    userId: user.id,
                    email: user.email,
                    purpose: "password_reset",
                    businessId: user.businessId
                });
                const response = NextResponse.json({
                error: "Please verify your email first", success: false, requiresPasswordChange: true,redirectTo: `/${user.business.slug}/reset-password`},
                {status: 403}
                );
                 // Set verification token cookie
                response.cookies.set(PASSWORD_RESET_COOKIE_NAME, reset_password, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 15 * 60, // 15 minutes
                });
                return response;
            }    

        //If user passes all checks    
            const token_object = {
                userId: user.id,
                businessId: user.businessId,
                businessSlug: user.business.slug,
                roleName: user.role.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                access: user.role.access,
                needsPasswordChange: user.needsPasswordChange
            } as JwtPayload;
            
            const token = generatePOSToken(token_object);
            const response = NextResponse.json({success: true, redirectTo: user.business.slug}, {status: 200})
            //Setting cookies
            response.cookies.set(POS_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60,
        });
        return response;
        }

        //If MULTIPLE businesses → let user choose
        return NextResponse.json({
        success: true,
        multipleBusinesses: true,
        businesses: validUsers.map((u) => ({
            name: u.business.name,
            slug: u.business.slug,
        })),
        },{status: 200});

    } catch (error) {
        console.log("Error logging in: ", error)
        return NextResponse.json({ error: "Internal Server Error -->" }, { status: 500 })
    }
}