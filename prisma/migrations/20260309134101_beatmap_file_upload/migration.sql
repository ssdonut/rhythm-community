-- CreateTable
CREATE TABLE "Beatmap" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beatmap_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Beatmap" ADD CONSTRAINT "Beatmap_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
