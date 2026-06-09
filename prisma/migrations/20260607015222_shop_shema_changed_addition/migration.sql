-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "city" TEXT,
ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gpsAddress" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,8),
ADD COLUMN     "longitude" DECIMAL(11,8),
ADD COLUMN     "openingTime" TEXT,
ADD COLUMN     "region" TEXT;
