-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('OWNER', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'EMPLOYEE';
