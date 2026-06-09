/*
  Warnings:

  - Made the column `shopId` on table `sales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_shopId_fkey";

-- DropIndex
DROP INDEX "employees_shopId_idx";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "currentShopId" TEXT;

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "shopId" SET NOT NULL;

-- CreateTable
CREATE TABLE "EmployeeShop" (
    "employeeId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,

    CONSTRAINT "EmployeeShop_pkey" PRIMARY KEY ("employeeId","shopId")
);

-- CreateIndex
CREATE INDEX "sales_shopId_createdAt_idx" ON "sales"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "EmployeeShop" ADD CONSTRAINT "EmployeeShop_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeShop" ADD CONSTRAINT "EmployeeShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
