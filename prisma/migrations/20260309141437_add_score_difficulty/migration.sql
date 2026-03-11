/*
  Warnings:

  - Added the required column `difficulty` to the `ScoreRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScoreRecord" ADD COLUMN     "difficulty" TEXT NOT NULL;
