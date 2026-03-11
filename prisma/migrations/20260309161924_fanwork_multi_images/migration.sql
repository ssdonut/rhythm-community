/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Fanwork` table. All the data in the column will be lost.
  - Added the required column `imageUrls` to the `Fanwork` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fanwork" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrls" TEXT NOT NULL;
