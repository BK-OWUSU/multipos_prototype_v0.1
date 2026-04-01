import { OTPResponse } from "@/types/auth";
import { prisma } from "./dbHelper";
import bcrypt from "bcrypt"
import { Prisma } from "./generated/prisma/client";

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP (HASHED)
export async function saveOTP(userId: string, code: string, transact: Prisma.TransactionClient): Promise<void> {
    const hashedOTP = await bcrypt.hash(code, 10);
    // delete old OTPs
    await transact.oTPVerification.deleteMany({
      where: { userId, isUsed: false },
    });

    // save new OTP
    await transact.oTPVerification.create({
      data: {userId,code: hashedOTP,expiresAt: new Date(Date.now() + 10 * 60 * 1000)},
      });
  
}

//Verify OTP
export async function verifyOTP(userId: string, code: string): Promise<OTPResponse> {
  if (!code) {
    return { valid: false, message: "OTP code is required" };
  }

  const otp = await prisma.oTPVerification.findFirst({
    where: {userId, isUsed: false},
    orderBy: {createdAt: "desc"},
  });
  console.log("OTP from DB: ", otp)

  if (!otp) {
    return { valid: false, message: "Invalid OTP" };
  }

    // Compare hashed OTP
  const isMatch = await bcrypt.compare(code, otp.code);
  
  if (!isMatch) {
    return { valid: false, message: "Invalid OTP" };
  }

  // Check expiry 
  if (otp.expiresAt < new Date()) {
    return {valid: false, message: "OTP has expired. Please request a new one"};
  }


  // Mark as used (transaction safe)
  await prisma.oTPVerification.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });
  return { valid: true, message: "OTP verified successfully" };
}