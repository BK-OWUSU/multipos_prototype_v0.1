/*
  Warnings:

  - You are about to drop the column `LastVisit` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "LastVisit",
ADD COLUMN     "lastVisit" TIMESTAMP(3),
ADD COLUMN     "registeredAtShopId" TEXT;

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_firstName_lastName_idx" ON "customers"("firstName", "lastName");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_registeredAtShopId_fkey" FOREIGN KEY ("registeredAtShopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
