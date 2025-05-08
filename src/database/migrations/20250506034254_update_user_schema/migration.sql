/*
  Warnings:

  - You are about to drop the `VideoGenerationJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoGenerationJob" DROP CONSTRAINT "VideoGenerationJob_audioId_fkey";

-- DropForeignKey
ALTER TABLE "VideoGenerationJob" DROP CONSTRAINT "VideoGenerationJob_videoId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "description" TEXT;

-- DropTable
DROP TABLE "VideoGenerationJob";

-- DropEnum
DROP TYPE "JobStatus";
