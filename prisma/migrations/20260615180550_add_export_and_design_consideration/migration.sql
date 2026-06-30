-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'MARKDOWN', 'CSV');

-- AlterEnum
ALTER TYPE "InsightType" ADD VALUE 'DESIGN_CONSIDERATION';

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Export_projectId_idx" ON "Export"("projectId");

-- CreateIndex
CREATE INDEX "Export_userId_idx" ON "Export"("userId");

-- CreateIndex
CREATE INDEX "Export_createdAt_idx" ON "Export"("createdAt");

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
