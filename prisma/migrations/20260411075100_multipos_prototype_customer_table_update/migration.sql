-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "LastVisit" TIMESTAMP(3),
ADD COLUMN     "TotalVisit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "firstVisit" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "time_cards" ADD COLUMN     "shopId" TEXT;

-- AddForeignKey
ALTER TABLE "time_cards" ADD CONSTRAINT "time_cards_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
