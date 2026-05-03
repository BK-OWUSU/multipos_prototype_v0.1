/*
  Warnings:

  - The values [CUSTOM_D] on the enum `RoleName` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleName_new" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'CUSTOM_A', 'CUSTOM_B', 'CUSTOM_C');
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "public"."RoleName_old";
COMMIT;
