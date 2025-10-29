/*
  Warnings:

  - Made the column `securityStamp` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pending2FASecret" TEXT,
ALTER COLUMN "securityStamp" SET NOT NULL;
