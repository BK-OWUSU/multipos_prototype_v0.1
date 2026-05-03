-- AlterTable
ALTER TABLE "businesses" ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'GHS',
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT '₵',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en-GH';
