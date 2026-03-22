-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Visit_userId_targetType_createdAt_idx" ON "Visit"("userId", "targetType", "createdAt");

-- CreateIndex
CREATE INDEX "Visit_targetType_targetId_createdAt_idx" ON "Visit"("targetType", "targetId", "createdAt");
