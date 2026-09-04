/*
  Warnings:

  - You are about to drop the column `isEmailVerified` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isEmailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
