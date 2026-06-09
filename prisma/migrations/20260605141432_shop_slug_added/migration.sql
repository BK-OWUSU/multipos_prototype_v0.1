/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `shops` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,slug]` on the table `shops` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `EmployeeShop` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `shops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmployeeShop" ADD COLUMN     "businessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "stock_logs" ADD COLUMN     "shopInventoryId" TEXT;

-- CreateIndex
CREATE INDEX "EmployeeShop_businessId_idx" ON "EmployeeShop"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "shops_businessId_slug_key" ON "shops"("businessId", "slug");

-- AddForeignKey
ALTER TABLE "stock_logs" ADD CONSTRAINT "stock_logs_shopInventoryId_fkey" FOREIGN KEY ("shopInventoryId") REFERENCES "shop_inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
