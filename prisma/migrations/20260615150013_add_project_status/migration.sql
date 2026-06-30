-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "platform" TEXT,
ADD COLUMN     "productType" TEXT,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE';
