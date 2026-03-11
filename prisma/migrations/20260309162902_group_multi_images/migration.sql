/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `GroupActivity` table. All the data in the column will be lost.
  - Added the required column `imageUrls` to the `GroupActivity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupActivity" DROP COLUMN "coverUrl",
ADD COLUMN     "imageUrls" TEXT NOT NULL;
