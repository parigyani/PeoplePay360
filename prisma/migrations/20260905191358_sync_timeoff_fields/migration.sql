/*
  Warnings:

  - You are about to drop the column `approverId` on the `Allocation` table. All the data in the column will be lost.
  - You are about to drop the column `approverId` on the `TimeOffRequest` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `TimeOffType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Allocation" DROP COLUMN "approverId",
ADD COLUMN     "approverRole" TEXT,
ALTER COLUMN "status" SET DEFAULT 'To Approve';

-- AlterTable
ALTER TABLE "TimeOffRequest" DROP COLUMN "approverId",
ADD COLUMN     "approverRole" TEXT;

-- AlterTable
ALTER TABLE "TimeOffType" DROP COLUMN "isActive",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payrollCode" TEXT;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
