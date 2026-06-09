/*
  Warnings:

  - You are about to drop the column `lowStockAlert` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `product_variants` table. All the data in the column will be lost.
  - Added the required column `shopId` to the `stock_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "lowStockAlert",
DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "stock_logs" ADD COLUMN     "shopId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "shop_inventories" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_inventories_businessId_idx" ON "shop_inventories"("businessId");

-- CreateIndex
CREATE INDEX "shop_inventories_shopId_idx" ON "shop_inventories"("shopId");

-- CreateIndex
CREATE INDEX "shop_inventories_productVariantId_idx" ON "shop_inventories"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_inventories_shopId_productVariantId_key" ON "shop_inventories"("shopId", "productVariantId");

-- CreateIndex
CREATE INDEX "stock_logs_shopId_createdAt_idx" ON "stock_logs"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "shop_inventories" ADD CONSTRAINT "shop_inventories_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_inventories" ADD CONSTRAINT "shop_inventories_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_inventories" ADD CONSTRAINT "shop_inventories_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
