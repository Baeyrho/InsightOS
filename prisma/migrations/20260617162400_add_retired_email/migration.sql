-- CreateTable
CREATE TABLE "RetiredEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "retiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetiredEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetiredEmail_email_key" ON "RetiredEmail"("email");

-- CreateIndex
CREATE INDEX "RetiredEmail_userId_idx" ON "RetiredEmail"("userId");
