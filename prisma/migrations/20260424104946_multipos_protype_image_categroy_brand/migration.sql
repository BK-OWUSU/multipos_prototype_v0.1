-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "workHrsCloseTime" TIMESTAMP(3),
ADD COLUMN     "workHrsStartTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileKey" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
