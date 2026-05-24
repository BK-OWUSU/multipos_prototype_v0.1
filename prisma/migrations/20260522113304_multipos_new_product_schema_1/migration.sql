/*
  Warnings:

  - You are about to drop the column `predefinedValues` on the `product_attributes` table. All the data in the column will be lost.
  - The primary key for the `product_variant_options` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attributeId` on the `product_variant_options` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `product_variant_options` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `product_variant_options` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `product_variant_options` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `basePriceFrom` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `discountId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `fileKey` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `lowStockAlert` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `totalStock` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,sku]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attributeValueId` to the `product_variant_options` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- DropForeignKey
ALTER TABLE "product_variant_options" DROP CONSTRAINT "product_variant_options_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_discountId_fkey";

-- DropIndex
DROP INDEX "product_variant_options_attributeId_idx";

-- DropIndex
DROP INDEX "product_variant_options_variantId_attributeId_key";

-- DropIndex
DROP INDEX "product_variant_options_variantId_idx";

-- DropIndex
DROP INDEX "product_variants_sku_key";

-- DropIndex
DROP INDEX "products_businessId_idx";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "idSequence" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "product_attributes" DROP COLUMN "predefinedValues";

-- AlterTable
ALTER TABLE "product_variant_options" DROP CONSTRAINT "product_variant_options_pkey",
DROP COLUMN "attributeId",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "value",
ADD COLUMN     "attributeValueId" TEXT NOT NULL,
ADD CONSTRAINT "product_variant_options_pkey" PRIMARY KEY ("variantId", "attributeValueId");

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "basePriceFrom",
DROP COLUMN "discountId",
DROP COLUMN "fileKey",
DROP COLUMN "imageUrl",
DROP COLUMN "lowStockAlert",
DROP COLUMN "totalStock",
ADD COLUMN     "hasVariant" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "cashSessionId" TEXT;

-- CreateTable
CREATE TABLE "variant_images" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attribute_values" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_sessions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "startFloat" DECIMAL(10,2) NOT NULL,
    "endFloat" DECIMAL(10,2),
    "expectedCash" DECIMAL(10,2),
    "actualCash" DECIMAL(10,2),
    "notes" TEXT,

    CONSTRAINT "cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variant_images_variantId_idx" ON "variant_images"("variantId");

-- CreateIndex
CREATE INDEX "product_attribute_values_attributeId_idx" ON "product_attribute_values"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attribute_values_attributeId_value_key" ON "product_attribute_values"("attributeId", "value");

-- CreateIndex
CREATE INDEX "cash_sessions_businessId_idx" ON "cash_sessions"("businessId");

-- CreateIndex
CREATE INDEX "cash_sessions_shopId_idx" ON "cash_sessions"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_sku_key" ON "product_variants"("productId", "sku");

-- AddForeignKey
ALTER TABLE "variant_images" ADD CONSTRAINT "variant_images_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "product_attribute_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "cash_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
