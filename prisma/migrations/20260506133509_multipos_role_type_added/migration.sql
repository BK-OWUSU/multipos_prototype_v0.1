-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SYSTEM', 'CUSTOM', 'TEMPORARY');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" "RoleType" NOT NULL DEFAULT 'TEMPORARY';
