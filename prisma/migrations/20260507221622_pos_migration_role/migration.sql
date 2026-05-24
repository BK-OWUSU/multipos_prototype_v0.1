/*
  Warnings:

  - Added the required column `updatedAt` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- CreateIndex
CREATE INDEX "roles_createdById_idx" ON "roles"("createdById");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
