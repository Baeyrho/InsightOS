-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "status" "InsightStatus" NOT NULL DEFAULT 'PENDING';
