import { PrismaClient, Role, PayrunStatus, PayslipStatus, LeaveUnit, RuleCategory, ComputeMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Manual "upserts" for low-cardinality reference tables to avoid schema constraints
  // Note: We use findFirst + update/create instead of deleteMany to avoid Foreign Key constraint errors
  // with the dependent rows (Contracts, Allocations, etc.) which we are upserting below.
  
  let schedule1 = await prisma.workingSchedule.findFirst({ where: { name: 'Standard 40h' } });
  if (!schedule1) {
    schedule1 = await prisma.workingSchedule.create({
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
  }

  let schedule2 = await prisma.workingSchedule.findFirst({ where: { name: 'Part-Time 20h' } });
  if (!schedule2) {
    schedule2 = await prisma.workingSchedule.create({
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
  }
  console.log('Upserted WorkingSchedules');

  const emp1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-1' },
    update: { scheduleId: schedule1.id },
    create: {
      employeeCode: 'EMP-1',
      name: 'Alice Manager',
      department: 'HR',
      jobPosition: 'HR Manager',
      status: 'Active',
      scheduleId: schedule1.id,
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-2' },
    update: { managerId: emp1.id, scheduleId: schedule1.id },
    create: {
      employeeCode: 'EMP-2',
      name: 'Bob Employee',
      department: 'Engineering',
      jobPosition: 'Software Engineer',
      status: 'Active',
      managerId: emp1.id,
      scheduleId: schedule1.id,
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-3' },
    update: { managerId: emp1.id, scheduleId: schedule2.id },
    create: {
      employeeCode: 'EMP-3',
      name: 'Charlie Employee',
      department: 'Engineering',
      jobPosition: 'QA Engineer',
      status: 'Active',
      managerId: emp1.id,
      scheduleId: schedule2.id,
    },
  });

  console.log('Upserted Employees:', emp1.name, emp2.name, emp3.name);

  function generateAttendancesForMonth(employeeId: number, year: number, monthIndex: number) {
    const records = [];
    const date = new Date(Date.UTC(year, monthIndex, 1));
    while (date.getUTCMonth() === monthIndex) {
      const dayOfWeek = date.getUTCDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 9:00 AM to 5:00 PM UTC
        const checkIn = new Date(date);
        checkIn.setUTCHours(9, 0, 0, 0);
        
        const checkOut = new Date(date);
        checkOut.setUTCHours(17, 0, 0, 0);

        const rand = Math.random();
        let status = 'Present';
        if (rand > 0.95) status = 'Absent';
        else if (rand > 0.85) status = 'Late';

        if (status === 'Absent') {
          records.push({ employeeId, checkIn, status });
        } else if (status === 'Late') {
          checkIn.setUTCMinutes(Math.floor(Math.random() * 60) + 10);
          records.push({ employeeId, checkIn, checkOut, status });
        } else {
          records.push({ employeeId, checkIn, checkOut, status });
        }
      }
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return records;
  }

  const attendanceData = [
    ...generateAttendancesForMonth(emp2.id, 2024, 7), // August 2024
    ...generateAttendancesForMonth(emp3.id, 2024, 7),
    ...generateAttendancesForMonth(emp2.id, 2026, 6), // July 2026
    ...generateAttendancesForMonth(emp3.id, 2026, 6),
    ...generateAttendancesForMonth(emp2.id, 2026, 7), // August 2026
    ...generateAttendancesForMonth(emp3.id, 2026, 7),
    ...generateAttendancesForMonth(emp2.id, 2026, 8), // Sept 2026
    ...generateAttendancesForMonth(emp3.id, 2026, 8),
  ];

  // We should clear old attendances for cleaner testing if we keep running seed
  await prisma.attendance.deleteMany({});
  
  await prisma.attendance.createMany({
    data: attendanceData
  });
  console.log('Upserted Mock Attendance records');


  let structure = await prisma.salaryStructure.findFirst({ where: { name: 'Standard Structure' } });
  if (!structure) {
    structure = await prisma.salaryStructure.create({
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
  }
  console.log('Upserted SalaryStructure');

  const contract1 = await prisma.contract.upsert({
    where: { code: 'C-EMP1-1' },
    update: {},
    create: {
      code: 'C-EMP1-1',
      employeeId: emp1.id,
      department: 'HR',
      jobPosition: 'HR Manager',
      wage: 5000,
      startDate: new Date('2024-01-01'),
      structureId: structure.id,
      status: 'Active',
    },
  });

  const contract2 = await prisma.contract.upsert({
    where: { code: 'C-EMP2-1' },
    update: {},
    create: {
      code: 'C-EMP2-1',
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

  const contract3 = await prisma.contract.upsert({
    where: { code: 'C-EMP2-2' },
    update: {},
    create: {
      code: 'C-EMP2-2',
      employeeId: emp2.id,
      department: 'Engineering',
      jobPosition: 'Senior Software Engineer',
      wage: 4500,
      startDate: new Date('2024-07-01'),
      structureId: structure.id,
      status: 'Active',
    },
  });
  console.log('Upserted Contracts');

  let toType1 = await prisma.timeOffType.findFirst({ where: { name: 'Paid Leave' } });
  if (!toType1) {
    toType1 = await prisma.timeOffType.create({
      data: {
        name: 'Paid Leave',
        unit: LeaveUnit.DAYS,
        requiresAllocation: true,
        payrollIntegrated: true,
      },
    });
  }

  let toType2 = await prisma.timeOffType.findFirst({ where: { name: 'Sick Leave' } });
  if (!toType2) {
    toType2 = await prisma.timeOffType.create({
      data: {
        name: 'Sick Leave',
        unit: LeaveUnit.DAYS,
        requiresAllocation: true,
        payrollIntegrated: true,
      },
    });
  }
  console.log('Upserted TimeOffTypes');

  await prisma.allocation.upsert({
    where: { employeeId_typeId_validFrom: { employeeId: emp2.id, typeId: toType1.id, validFrom: new Date('2024-01-01') } },
    update: {},
    create: {
      employeeId: emp2.id,
      typeId: toType1.id,
      allocated: 20,
      taken: 5,
      remaining: 15,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31'),
    },
  });

  await prisma.timeOffRequest.upsert({
    where: { employeeId_typeId_startDate: { employeeId: emp2.id, typeId: toType1.id, startDate: new Date('2024-08-01') } },
    update: {},
    create: {
      employeeId: emp2.id,
      typeId: toType1.id,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-08-02'),
      duration: 2,
      status: 'Pending',
    },
  });

  await prisma.timeOffRequest.upsert({
    where: { employeeId_typeId_startDate: { employeeId: emp2.id, typeId: toType1.id, startDate: new Date('2024-08-10') } },
    update: {},
    create: {
      employeeId: emp2.id,
      typeId: toType1.id,
      startDate: new Date('2024-08-10'),
      endDate: new Date('2024-08-14'),
      duration: 5,
      status: 'Approved',
    },
  });
  console.log('Upserted Allocations and TimeOffRequests');

  let payrun = await prisma.payrun.findFirst({ where: { name: 'August 2024 Payrun' } });
  if (!payrun) {
    payrun = await prisma.payrun.create({
      data: {
        name: 'August 2024 Payrun',
        periodStart: new Date('2024-08-01'),
        periodEnd: new Date('2024-08-31'),
        structureId: structure.id,
        status: PayrunStatus.DRAFT,
      },
    });
  }

  await prisma.payslip.upsert({
    where: { payrunId_employeeId: { payrunId: payrun.id, employeeId: emp2.id } },
    update: {},
    create: {
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
  console.log('Upserted Payrun and fake Payslip');

  const defaultPassword = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@peoplepay360.com' },
    update: {},
    create: {
      email: 'admin@peoplepay360.com',
      password: defaultPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'employee@peoplepay360.com' },
    update: {},
    create: {
      email: 'employee@peoplepay360.com',
      password: defaultPassword,
      role: Role.EMPLOYEE,
      employeeId: emp2.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'hrmanager@peoplepay360.com' },
    update: {},
    create: {
      email: 'hrmanager@peoplepay360.com',
      password: defaultPassword,
      role: Role.HR_MANAGER,
      employeeId: emp1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'payrollmanager@peoplepay360.com' },
    update: {},
    create: {
      email: 'payrollmanager@peoplepay360.com',
      password: defaultPassword,
      role: Role.HR_PAYROLL_MANAGER,
    },
  });

  console.log('Upserted 4 RBAC Demo Users');

  const allEmployees = [emp1, emp2, emp3];
  const demoAccountEmployeeIds = [emp1.id, emp2.id];
  for (const emp of allEmployees) {
    if (demoAccountEmployeeIds.includes(emp.id)) continue;
    
    const generatedEmail = `${emp.name.toLowerCase().replace(/\s+/g, '.')}@peoplepay360.com`;

    await prisma.user.upsert({
      where: { email: generatedEmail },
      update: {},
      create: {
        email: generatedEmail,
        password: defaultPassword,
        role: Role.EMPLOYEE,
        employeeId: emp.id,
      },
    });
    console.log(`Upserted per-employee User: ${generatedEmail}`);
  }

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
