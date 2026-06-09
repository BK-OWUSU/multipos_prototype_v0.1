/*
  Warnings:

  - You are about to drop the column `shopId` on the `employees` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_shopId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "shopId";

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_currentShopId_fkey" FOREIGN KEY ("currentShopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
