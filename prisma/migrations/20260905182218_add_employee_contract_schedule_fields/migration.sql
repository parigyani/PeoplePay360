/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "approverId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "company" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "workLocation" TEXT;

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

-- AlterTable
ALTER TABLE "WorkingSchedule" ADD COLUMN     "company" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "timezone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");
