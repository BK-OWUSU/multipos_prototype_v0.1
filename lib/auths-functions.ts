import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { NextResponse } from "next/server";
// import jwtVerify2 from "jose"
import {jwtVerify, decodeJwt, errors} from "jose"
import { JwtPayload, PosPayload} from "@/types/auth/auth";
import { cookies } from "next/headers";
const POS_COOKIE_NAME = "pos_token";
const VERIFY_COOKIE_NAME = "verify_token";
const PASSWORD_RESET_COOKIE_NAME = "password_reset";
const POS_CASH_SESSION_NAME = "pos__cash_session_token"

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


//FOR EMAIL VERIFICATION TOKEN
export function generateEmailVerificationToken(payload:{userId: string, email: string, purpose?: string, businessId?: string }): string {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRETE is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "10m"}) //Expires in 10 minutes
}

// For JWT token generation the POS Cash Session,
export function generatePOSCashSessionToken (payload: PosPayload): string  {
    const JWT_SECRET = process.env.JWT_SECRET!
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(payload, JWT_SECRET, {expiresIn: "12h"}) //Expires in 1 days
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


// This is only used in API routes, NOT in middleware
export function verifyPOSCashSessionToken(token: string): PosPayload | null {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const decode = jwt.verify(token, JWT_SECRET) as PosPayload;
        return decode; // Return the actual payload object
    } catch (error) {
        console.log("Error verifying token: ", error)
        return null;
    }
}


//for middleware token verification, jose is needed 
export async function verifyPOSTokenEdge(token: string): Promise<{payload: JwtPayload, isExpired: boolean} | null> {
    try {
        const JWT_SECRET = process.env.JWT_SECRET!
         if (!JWT_SECRET) {
            throw new Error("JWT_SECRETE is not defined");
        }
        const secrete = new TextEncoder().encode(JWT_SECRET);
        const {payload} = await jwtVerify(token, secrete)
        return {payload: payload as JwtPayload, isExpired: false };
    } catch (error: unknown) {
        console.log("Error verifying token: ", error)
        // Check if the error is due to token expiration
        // Safe type guard using jose's built-in JWTExpired class
        if (error instanceof errors.JWTExpired) {
            try {
                const decoded = decodeJwt(token) as JwtPayload;
                return { payload: decoded, isExpired: true };
            } catch (decodeError) {
                console.log("Error decoding expired token: ", decodeError);
                return null;
            }
        }
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

export async function getPOSCashSession(): Promise<PosPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(POS_CASH_SESSION_NAME)?.value;
  if (!token) return null;
  return verifyPOSCashSessionToken(token) as PosPayload;
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


//CLEARING

//Attaches the signed POS Cash Session token into HttpOnly cookies on a response object.
export function setPOSCashSessionCookie(response: NextResponse, payload: PosPayload): void {
  const token = generatePOSCashSessionToken(payload);
  
  response.cookies.set(POS_CASH_SESSION_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60, // 12 Hours (matches your JWT expiration window precisely)
    path: "/", // Ensures access across all sibling nested api/page layers
  });
}


 //Evicts the session token completely from the client browser cache drawer.
export function clearPOSCashSessionCookie(response: NextResponse): void {
  response.cookies.set(POS_CASH_SESSION_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Instructs browser to expire row immediately
    path: "/",
  });
}

export { POS_COOKIE_NAME, VERIFY_COOKIE_NAME,PASSWORD_RESET_COOKIE_NAME, POS_CASH_SESSION_NAME };