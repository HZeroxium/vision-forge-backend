/*
  Warnings:

  - You are about to drop the column `videoId` on the `Script` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_id_fkey";

-- DropIndex
DROP INDEX "Script_videoId_key";

-- AlterTable
ALTER TABLE "Script" DROP COLUMN "videoId";

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;
