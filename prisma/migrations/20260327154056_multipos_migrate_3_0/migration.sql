/*
  Warnings:

  - You are about to drop the column `otp` on the `otp_verifications` table. All the data in the column will be lost.
  - You are about to drop the column `otpIsUsed` on the `otp_verifications` table. All the data in the column will be lost.
  - Added the required column `code` to the `otp_verifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otp_verifications" DROP COLUMN "otp",
DROP COLUMN "otpIsUsed",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false;
