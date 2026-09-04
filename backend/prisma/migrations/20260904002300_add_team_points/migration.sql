-- CreateTable
CREATE TABLE "TeamPointsTransaction" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPointsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamPointsTransaction_teamId_idx" ON "TeamPointsTransaction"("teamId");

-- AddForeignKey
ALTER TABLE "TeamPointsTransaction" ADD CONSTRAINT "TeamPointsTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
