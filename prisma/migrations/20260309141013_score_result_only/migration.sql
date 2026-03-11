/*
  Warnings:

  - You are about to drop the column `accuracy` on the `ScoreRecord` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `ScoreRecord` table. All the data in the column will be lost.
  - Added the required column `result` to the `ScoreRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScoreRecord" DROP COLUMN "accuracy",
DROP COLUMN "score",
ADD COLUMN     "result" TEXT NOT NULL;
