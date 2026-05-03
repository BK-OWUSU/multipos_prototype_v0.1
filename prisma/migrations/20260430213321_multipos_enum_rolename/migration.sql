-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('OWNER', 'ADMIN', 'CASHIER', 'CUSTOM_A', 'CUSTOM_B', 'CUSTOM_C', 'CUSTOM_D');

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accessGrantedBy_fkey" FOREIGN KEY ("accessGrantedBy") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
