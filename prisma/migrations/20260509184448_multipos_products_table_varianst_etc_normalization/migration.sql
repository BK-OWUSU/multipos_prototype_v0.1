/*
  Warnings:

  - You are about to drop the column `costPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `stock_logs` table. All the data in the column will be lost.
  - Added the required column `productVariantId` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productVariantId` to the `stock_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "stock_logs" DROP CONSTRAINT "stock_logs_productId_fkey";

-- DropIndex
DROP INDEX "products_sku_idx";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "stock_logs_businessId_idx";

-- DropIndex
DROP INDEX "stock_logs_productId_createdAt_idx";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "costPrice",
DROP COLUMN "price",
DROP COLUMN "sku",
DROP COLUMN "stock",
ADD COLUMN     "basePriceFrom" DECIMAL(10,2),
ADD COLUMN     "baseSku" TEXT,
ADD COLUMN     "totalStock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale_items" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_logs" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "imageUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 5,
    "weight" DECIMAL(8,3),
    "length" DECIMAL(8,2),
    "width" DECIMAL(8,2),
    "height" DECIMAL(8,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "predefinedValues" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_options" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_barcode_idx" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_attributes_businessId_idx" ON "product_attributes"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_businessId_name_key" ON "product_attributes"("businessId", "name");

-- CreateIndex
CREATE INDEX "product_variant_options_variantId_idx" ON "product_variant_options"("variantId");

-- CreateIndex
CREATE INDEX "product_variant_options_attributeId_idx" ON "product_variant_options"("attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_options_variantId_attributeId_key" ON "product_variant_options"("variantId", "attributeId");

-- CreateIndex
CREATE INDEX "stock_logs_productVariantId_createdAt_idx" ON "stock_logs"("productVariantId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_logs_businessId_createdAt_idx" ON "stock_logs"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_options" ADD CONSTRAINT "product_variant_options_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "product_attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
