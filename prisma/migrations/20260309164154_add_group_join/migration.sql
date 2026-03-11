-- CreateTable
CREATE TABLE "GroupJoin" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupJoin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupJoin" ADD CONSTRAINT "GroupJoin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupActivity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoin" ADD CONSTRAINT "GroupJoin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
