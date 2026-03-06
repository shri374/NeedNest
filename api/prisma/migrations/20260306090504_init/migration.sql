-- CreateEnum
CREATE TYPE "IssueLevel" AS ENUM ('MINOR', 'SMALL', 'MAJOR', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'QUOTE_SENT';
ALTER TYPE "BookingStatus" ADD VALUE 'QUOTE_REJECTED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "issueLevel" "IssueLevel" NOT NULL DEFAULT 'SMALL',
ADD COLUMN     "problemText" TEXT,
ADD COLUMN     "quoteNote" TEXT,
ADD COLUMN     "quotedPrice" DOUBLE PRECISION,
ADD COLUMN     "requestedPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "majorPrice" DOUBLE PRECISION,
ADD COLUMN     "minorPrice" DOUBLE PRECISION,
ADD COLUMN     "smallPrice" DOUBLE PRECISION,
ADD COLUMN     "workType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "workType" TEXT;
