/*
  Warnings:

  - The values [BOTH] on the enum `PaymentType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[businessId,baseSku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Made the column `baseSku` on table `products` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentType_new" AS ENUM ('CASH', 'MOBILE_MONEY', 'CARD', 'SPLIT');
ALTER TABLE "public"."sales" ALTER COLUMN "paymentType" DROP DEFAULT;
ALTER TABLE "sales" ALTER COLUMN "paymentType" TYPE "PaymentType_new" USING ("paymentType"::text::"PaymentType_new");
ALTER TYPE "PaymentType" RENAME TO "PaymentType_old";
ALTER TYPE "PaymentType_new" RENAME TO "PaymentType";
DROP TYPE "public"."PaymentType_old";
ALTER TABLE "sales" ALTER COLUMN "paymentType" SET DEFAULT 'CASH';
COMMIT;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "baseSku" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "products_businessId_baseSku_key" ON "products"("businessId", "baseSku");
