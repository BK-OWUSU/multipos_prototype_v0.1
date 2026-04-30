/*
  Warnings:

  - The values [CREDIT] on the enum `PaymentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `stock_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `time_cards` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `fileKey` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `stock_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `time_cards` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('CASH', 'MOBILE_MONEY', 'BOTH');
ALTER TABLE "public"."sales" ALTER COLUMN "paymentType" DROP DEFAULT;
ALTER TABLE "sales" ALTER COLUMN "paymentType" TYPE "PaymentType_new" USING ("paymentType"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "public"."PaymentType_old";
ALTER TABLE "sales" ALTER COLUMN "paymentType" SET DEFAULT 'CASH';
COMMIT;

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_userId_fkey";

-- DropForeignKey
ALTER TABLE "stock_logs" DROP CONSTRAINT "stock_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "time_cards" DROP CONSTRAINT "time_cards_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_businessId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_shopId_fkey";

-- DropIndex
DROP INDEX "stock_logs_businessId_userId_idx";

-- DropIndex
DROP INDEX "users_businessId_idx";

-- DropIndex
DROP INDEX "users_email_businessId_key";

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_logs" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "time_cards" DROP COLUMN "userId",
ADD COLUMN     "employeeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "businessId",
DROP COLUMN "deletedAt",
DROP COLUMN "email",
DROP COLUMN "fileKey",
DROP COLUMN "firstName",
DROP COLUMN "imageUrl",
DROP COLUMN "isActive",
DROP COLUMN "isDeleted",
DROP COLUMN "lastName",
DROP COLUMN "phone",
DROP COLUMN "roleId",
DROP COLUMN "shopId",
ADD COLUMN     "accessGrantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "accessGrantedBy" TEXT,
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ALTER COLUMN "needsPasswordChange" SET DEFAULT true;

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "imageUrl" TEXT,
    "fileKey" TEXT,
    "businessId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "shopId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasSystemAccess" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employees_businessId_idx" ON "employees"("businessId");

-- CreateIndex
CREATE INDEX "employees_shopId_idx" ON "employees"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_businessId_key" ON "employees"("email", "businessId");

-- CreateIndex
CREATE INDEX "sales_employeeId_idx" ON "sales"("employeeId");

-- CreateIndex
CREATE INDEX "stock_logs_businessId_employeeId_idx" ON "stock_logs"("businessId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE INDEX "users_employeeId_idx" ON "users"("employeeId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_cards" ADD CONSTRAINT "time_cards_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
