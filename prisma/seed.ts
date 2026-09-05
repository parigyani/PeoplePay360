import { PrismaClient, Role, PayrunStatus, PayslipStatus, LeaveUnit, RuleCategory, ComputeMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  console.log('Admin plaintext password: admin123');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@peoplepay360.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('Created Admin User:', adminUser.email);

  const emp1 = await prisma.employee.create({
    data: {
      name: 'Alice Manager',
      department: 'HR',
      jobPosition: 'HR Manager',
      status: 'Active',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: 'Bob Employee',
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      status: 'Active',
      managerId: emp1.id,
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      name: 'Charlie Employee',
      department: 'Engineering',
      jobPosition: 'QA Engineer',
      status: 'Active',
      managerId: emp1.id,
    },
  });

  console.log('Created Employees:', emp1.name, emp2.name, emp3.name);

  await prisma.attendance.createMany({
    data: [
      { employeeId: emp2.id, checkIn: new Date('2024-08-01T09:00:00Z'), checkOut: new Date('2024-08-01T17:00:00Z'), status: 'Present' },
      { employeeId: emp2.id, checkIn: new Date('2024-08-02T09:00:00Z'), checkOut: new Date('2024-08-02T17:00:00Z'), status: 'Absent' },
      { employeeId: emp3.id, checkIn: new Date('2024-08-01T09:00:00Z'), checkOut: new Date('2024-08-01T17:00:00Z'), status: 'Present' }
    ]
  });
  console.log('Created Mock Attendance records');

  const schedule1 = await prisma.workingSchedule.create({
    data: {
      name: 'Standard 40h',
      type: 'Fixed',
      weeklyHours: 40,
      patterns: {
        create: [
          { day: 'Monday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
          { day: 'Tuesday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
          { day: 'Wednesday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
          { day: 'Thursday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
          { day: 'Friday', startTime: '09:00', endTime: '17:00', breakMins: 60 },
        ],
      },
    },
  });

  const schedule2 = await prisma.workingSchedule.create({
    data: {
      name: 'Part-Time 20h',
      type: 'Fixed',
      weeklyHours: 20,
      patterns: {
        create: [
          { day: 'Monday', startTime: '09:00', endTime: '13:00', breakMins: 0 },
          { day: 'Tuesday', startTime: '09:00', endTime: '13:00', breakMins: 0 },
          { day: 'Wednesday', startTime: '09:00', endTime: '13:00', breakMins: 0 },
          { day: 'Thursday', startTime: '09:00', endTime: '13:00', breakMins: 0 },
          { day: 'Friday', startTime: '09:00', endTime: '13:00', breakMins: 0 },
        ],
      },
    },
  });
  console.log('Created WorkingSchedules');

  await prisma.employee.update({ where: { id: emp1.id }, data: { scheduleId: schedule1.id } });
  await prisma.employee.update({ where: { id: emp2.id }, data: { scheduleId: schedule1.id } });
  await prisma.employee.update({ where: { id: emp3.id }, data: { scheduleId: schedule2.id } });

  const structure = await prisma.salaryStructure.create({
    data: {
      name: 'Standard Structure',
      rules: {
        create: [
          { name: 'Basic Salary', code: 'BASIC', category: RuleCategory.BASIC, sequence: 1, method: ComputeMethod.FORMULA, formula: 'WAGE' },
          { name: 'House Rent Allowance', code: 'HRA', category: RuleCategory.ALLOWANCE, sequence: 2, method: ComputeMethod.PERCENTAGE, value: 20, formula: 'BASIC' },
          { name: 'Provident Fund', code: 'PF', category: RuleCategory.DEDUCTION, sequence: 3, method: ComputeMethod.PERCENTAGE, value: 12, formula: 'BASIC' },
          { name: 'Gross Salary', code: 'GROSS', category: RuleCategory.GROSS, sequence: 4, method: ComputeMethod.FORMULA, formula: 'BASIC + HRA' },
          { name: 'Net Salary', code: 'NET', category: RuleCategory.NET, sequence: 5, method: ComputeMethod.FORMULA, formula: 'GROSS - PF' },
        ],
      },
    },
  });
  console.log('Created SalaryStructure');

  const contract1 = await prisma.contract.create({
    data: {
      employeeId: emp1.id,
      department: 'HR',
      jobPosition: 'HR Manager',
      wage: 5000,
      startDate: new Date('2024-01-01'),
      structureId: structure.id,
      status: 'Active',
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      employeeId: emp2.id,
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      wage: 4000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-07-15'),
      structureId: structure.id,
      status: 'Expired',
    },
  });

  const contract3 = await prisma.contract.create({
    data: {
      employeeId: emp2.id,
      department: 'Engineering',
      jobPosition: 'Senior Software Engineer',
      wage: 4500,
      startDate: new Date('2024-07-01'),
      structureId: structure.id,
      status: 'Active',
    },
  });
  console.log('Created Contracts including overlapping/adjacent pair for emp2');

  const toType1 = await prisma.timeOffType.create({
    data: {
      name: 'Paid Leave',
      unit: LeaveUnit.DAYS,
      requiresAllocation: true,
      payrollIntegrated: true,
    },
  });

  const toType2 = await prisma.timeOffType.create({
    data: {
      name: 'Sick Leave',
      unit: LeaveUnit.DAYS,
      requiresAllocation: true,
      payrollIntegrated: true,
    },
  });
  console.log('Created TimeOffTypes');

  await prisma.allocation.create({
    data: {
      employeeId: emp2.id,
      typeId: toType1.id,
      allocated: 20,
      taken: 5,
      remaining: 15,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
    },
  });

  await prisma.timeOffRequest.create({
    data: {
      employeeId: emp2.id,
      typeId: toType1.id,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-02'),
      duration: 2,
      status: 'Pending',
    },
  });

  await prisma.timeOffRequest.create({
    data: {
      employeeId: emp2.id,
      typeId: toType1.id,
      startDate: new Date('2024-08-10'),
      endDate: new Date('2024-08-14'),
      duration: 5,
      status: 'Approved',
    },
  });
  console.log('Created Allocations and TimeOffRequests (Pending and Approved)');

  const payrun = await prisma.payrun.create({
    data: {
      name: 'August 2024 Payrun',
      periodStart: new Date('2024-08-01'),
      periodEnd: new Date('2024-08-31'),
      structureId: structure.id,
      status: PayrunStatus.DRAFT,
    },
  });

  const payslip = await prisma.payslip.create({
    data: {
      payrunId: payrun.id,
      employeeId: emp2.id,
      contractId: contract3.id,
      workedDays: 20,
      lines: [
        { code: 'BASIC', name: 'Basic Salary', amount: 4500 },
        { code: 'HRA', name: 'House Rent Allowance', amount: 900 },
        { code: 'GROSS', name: 'Gross Salary', amount: 5400 },
        { code: 'PF', name: 'Provident Fund', amount: 540 },
        { code: 'NET', name: 'Net Salary', amount: 4860 },
      ],
      gross: 5400,
      net: 4860,
      status: PayslipStatus.DRAFT,
      warnings: [],
    },
  });
  console.log('Created Payrun and fake Payslip');

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
