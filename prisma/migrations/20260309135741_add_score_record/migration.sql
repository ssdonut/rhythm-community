-- CreateTable
CREATE TABLE "ScoreRecord" (
    "id" SERIAL NOT NULL,
    "game" TEXT NOT NULL,
    "songTitle" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "rank" TEXT NOT NULL,
    "comment" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScoreRecord" ADD CONSTRAINT "ScoreRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
