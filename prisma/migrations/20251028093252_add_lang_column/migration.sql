/*
  Warnings:

  - You are about to drop the `TagTranslation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TagTranslation" DROP CONSTRAINT "TagTranslation_tagId_fkey";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'vi';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'vi';

-- DropTable
DROP TABLE "public"."TagTranslation";
