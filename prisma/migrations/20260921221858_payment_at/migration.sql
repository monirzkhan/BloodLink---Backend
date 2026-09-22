/*
  Warnings:

  - The `paidAt` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `refundedAt` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paidAt",
ADD COLUMN     "paidAt" TIMESTAMP(3),
DROP COLUMN "refundedAt",
ADD COLUMN     "refundedAt" TIMESTAMP(3);
