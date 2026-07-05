import { generateEmailVerificationToken, hashPassword, VERIFY_COOKIE_NAME } from "@/lib/auths";
import { prisma } from "@/lib/dbHelper";
import { sendOTPEmail } from "@/lib/email";
import { AccountType, RoleName, RoleType } from "@/generated/prisma/enums";
import { generateOTP, saveOTP } from "@/lib/otp";
import { generateUniqueSlug } from "@/lib/slugGenerator";
import { NextResponse } from "next/server";
import { seedRoles } from "@/lib/services/seed/roles.seed";
import { getAllInfoByISO } from 'iso-country-currency';
import { SignUpFormSchema, signupSchema } from "@/types/schema/auth.schema";

export class SignUpService {
static async signUp(rawData: SignUpFormSchema) {
    try {

        const validatedData = signupSchema.parse(rawData);
        const { businessName, email, password, firstName, lastName, countryCode } = validatedData;

        // Get the rich metadata from the latest library version
        const countryData = getAllInfoByISO(countryCode);
        if (!countryData) throw new Error("Unsupported country selected.");
        //Generate unique slug for the business and password hash
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
        const {user, otpCode, ownerEmployee, ownerRole,business } = await prisma.$transaction(async(transact)=> {
            // 1️ Creating Business
            const business = await transact.business.create({
                data : {
                    name: businessName, 
                    slug: subdomainSlug, 
                    email,
                    countryCode: validatedData.countryCode,
                    currencyCode: countryData.currency,
                    currencySymbol: countryData.symbol,
                    dateFormat: countryData.dateFormat,
                    locale: validatedData.countryCode === 'GH' ? 'en-GH' : 'en-US',
                    termsAgreement: validatedData.termsAgreement
                }
            });
            
            // 2 Creating Owner Role for the new business
            const ownerRole = await transact.role.create({
                data: {
                    name: RoleName.OWNER,
                    permissions: ["*"],
                    access: ["*"],
                    businessId: business.id,
                    isSystem: true,
                    type: RoleType.SYSTEM,
                    createdById: null, 
                    updatedById: null
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
                    hasSystemAccess: true, 
                }
            });
            // 4 Creating OWNER User Account
             const user = await transact.user.create({
                data: {
                    accountType: AccountType.OWNER,
                    password: hashedPassword,
                    employeeId: ownerEmployee.id,
                    needsPasswordChange: false
                },
            });

            //Creating Other Roles for the new Business
            await seedRoles(user.id, business.id, transact,);

            // 5 Generating OPT
            const otpCode = generateOTP();
            await saveOTP(user.id, otpCode, transact);
            return { user, otpCode, ownerEmployee, ownerRole, business };
        })

        await prisma.role.update({
            where: {id: ownerRole.id, businessId: business.id},
            data: {
            createdById: user.id, 
            updatedById: user.id  
        }
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
}