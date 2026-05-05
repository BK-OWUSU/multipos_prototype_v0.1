/*
  Warnings:

  - You are about to drop the column `TotalVisit` on the `customers` table. All the data in the column will be lost.
  - Added the required column `costPrice` to the `sale_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "TotalVisit",
ADD COLUMN     "totalVisit" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "costPrice" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE INDEX "sales_businessId_status_idx" ON "sales"("businessId", "status");
