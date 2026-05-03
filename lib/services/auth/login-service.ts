import { 
    POS_COOKIE_NAME, 
    generateEmailVerificationToken, 
    generatePOSToken, 
    VERIFY_COOKIE_NAME, 
    verifyPassword, 
    PASSWORD_RESET_COOKIE_NAME 
} from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { generateOTP, saveOTP } from "@/lib/otp";
import { JwtPayload } from "@/types/auth";
import { NextResponse } from "next/server";

export async function login(email: string, password: string ) {
    try {
        if (!email || !password) {
            return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
        }

        // 1. Find ALL active user instances linked to this email across all businesses
        const users = await prisma.user.findMany({
            where: {
                employee: {
                    email: email,
                    isActive: true,
                    isDeleted: false
                }
            },
            include: {
                employee: {
                    include: {
                        business: true,
                        role: true,
                        shop: true
                    }
                }
            }
        });

        if (users.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // 2. Filter for users with the correct password
        const validUsers = [];
        for (const user of users) {
            const isValidPassword = await verifyPassword(password, user.password);
            if (isValidPassword) {
                validUsers.push(user);
            }
        }

        if (validUsers.length === 0) {
            return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
        }

        // 3. Handle specific scenario: Only ONE valid business found
        if (validUsers.length === 1) {
            const user = validUsers[0];
            const emp = user.employee;

            // Check if email is verified
            if (!user.isVerified) {
                const verifyToken = generateEmailVerificationToken({ userId: user.id, email: emp.email });
                const response = NextResponse.json(
                    { error: "Please verify your email first", isVerified: false, redirectTo: `/verify-email?email=${encodeURIComponent(emp.email)}`, success: false },
                    { status: 403 }
                );

                const otpCode = await prisma.$transaction(async (tx) => {
                    const code = generateOTP();
                    await saveOTP(user.id, code, tx);
                    return code;
                });

                try {
                    await sendOTPEmail(emp.email, emp.firstName, otpCode);
                } catch (err) {
                    console.error("Email sending failed:", err);
                }

                response.cookies.set(VERIFY_COOKIE_NAME, verifyToken, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 10 * 60,
                });
                return response;
            }

            // Check if password change is required (e.g., first-time login for staff)
            if (user.needsPasswordChange) {
                const resetToken = generateEmailVerificationToken({
                    userId: user.id,
                    email: emp.email,
                    purpose: "password_reset",
                    businessId: emp.businessId
                });
                
                const response = NextResponse.json(
                    { error: "Password change required", success: false, requiresPasswordChange: true, redirectTo: `/${emp.business.slug}/reset-password` },
                    { status: 403 }
                );

                response.cookies.set(PASSWORD_RESET_COOKIE_NAME, resetToken, {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 15 * 60,
                });
                return response;
            }

            // 4. Successful Login - Generate Session
            const tokenObject: JwtPayload = {
                userId: user.id,
                employeeId: emp.id,
                businessId: emp.businessId,
                businessSlug: emp.business.slug,
                roleName: emp.role.name,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                access: emp.role.access,
                shopId: emp.shopId || undefined
            };

            const token = generatePOSToken(tokenObject);
            const response = NextResponse.json({ success: true, redirectTo: `/${emp.business.slug}/dashboard` }, { status: 200 });

            response.cookies.set(POS_COOKIE_NAME, token, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 60, // 30 minutes
            });

            return response;
        }

        // 5. Handle Multiple Businesses: Return choices to the frontend
        return NextResponse.json({
            success: true,
            multipleBusinesses: true,
            businesses: validUsers.map((u) => ({
                name: u.employee.business.name,
                slug: u.employee.business.slug,
            })),
        }, { status: 200 });

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}