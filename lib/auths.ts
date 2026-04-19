import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
// import jwtVerify2 from "jose"
import {jwtVerify} from "jose"
import { JwtPayload} from "@/types/auth";
import { cookies } from "next/headers";
const POS_COOKIE_NAME = "pos_token";
const VERIFY_COOKIE_NAME = "verify_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";
// For hashing passwords, 
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}
//For password verification,
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password,hashedPassword)
}
// For JWT token generation the POS,
export function generatePOSToken (payload: JwtPayload): string  {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRETE is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "3d"}) //Expires in 3 days
}

// This is only used in API routes, NOT in middleware
export function verifyPOSToken(token: string): JwtPayload | null {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const decode = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decode; // Return the actual payload object
    } catch (error) {
        console.log("Error verifying token: ", error)
        return null;
    }
}

//for middleware token verification, jose is needed 
export async function verifyPOSTokenEdge(token: string): Promise<JwtPayload | null> {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
         if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const secrete = new TextEncoder().encode(JWT_SECRET);
        const {payload} = await jwtVerify(token, secrete)
        return payload as JwtPayload;
    } catch (error) {
        console.log("Error verifying token: ", error)
        return null;
    }
}
// Utility function to get session in API routes
export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(POS_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPOSToken(token) as JwtPayload;
}

//FOR EMAIL VERIFICATION TOKEN
export function generateEmailVerificationToken(payload:{userId: string, email: string, purpose?: string, businessId?: string }): string {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRETE is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "10m"}) //Expires in 10 minutes
}

export function verifyEmailVerificationToken(token: string): { userId: string; email: string, purpose?: string, businessId?: string } | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET!;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string, purpose?: string};
  } catch (error) {
    console.log("Verify token error:", error);
    return null;
  }
}

export { POS_COOKIE_NAME, VERIFY_COOKIE_NAME,PASSWORD_RESET_COOKIE_NAME };