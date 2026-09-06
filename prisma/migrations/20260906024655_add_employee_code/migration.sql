/*
  Warnings:

  - A unique constraint covering the columns `[employeeId,typeId,validFrom]` on the table `Allocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId,checkIn]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeCode]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payrunId,employeeId]` on the table `Payslip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId,typeId,startDate]` on the table `TimeOffRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "employeeCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_employeeId_typeId_validFrom_key" ON "Allocation"("employeeId", "typeId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_checkIn_key" ON "Attendance"("employeeId", "checkIn");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrunId_employeeId_key" ON "Payslip"("payrunId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeOffRequest_employeeId_typeId_startDate_key" ON "TimeOffRequest"("employeeId", "typeId", "startDate");
