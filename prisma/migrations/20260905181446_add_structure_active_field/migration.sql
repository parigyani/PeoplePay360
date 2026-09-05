-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "approverId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "SalaryStructure" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TimeOffRequest" ADD COLUMN     "allocationId" INTEGER,
ADD COLUMN     "approverId" INTEGER,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "TimeOffType" ADD COLUMN     "approverRole" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
