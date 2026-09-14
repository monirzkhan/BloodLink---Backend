-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BloodRequestStatus" ADD VALUE 'NO_DONOR_FOUND';
ALTER TYPE "BloodRequestStatus" ADD VALUE 'SEARCHING_DONORS';

-- AlterTable
ALTER TABLE "blood_request_donors" ADD COLUMN     "expiresAt" TIMESTAMP(3);
