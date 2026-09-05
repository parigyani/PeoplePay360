import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from './DashboardCharts';
import { PayrollDashboardFilters } from './PayrollDashboardFilters';

export default async function PayrollDashboard({ searchParams }: { searchParams: Promise<{ period?: string; department?: string }> }) {
  const { period, department } = await searchParams;

  // 1. Fetch Distinct Departments for the filter
  const deptRecords = await prisma.employee.findMany({ select: { department: true }, distinct: ['department'] });
  const departments = deptRecords.map(d => d.department).filter(Boolean);

  // Build Filters
  const wherePayslip: any = {};
  const whereTimeOff: any = {};
  const whereAttendance: any = {};
  const whereEmployee: any = {};

  if (department && department !== 'all') {
    wherePayslip.employee = { department };
    whereTimeOff.employee = { department };
    whereAttendance.employee = { department };
    whereEmployee.department = department;
  }

  if (period && period !== 'all') {
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    wherePayslip.payrun = { periodStart: { gte: startDate, lte: endDate } };
    whereTimeOff.startDate = { gte: startDate, lte: endDate };
    whereAttendance.checkIn = { gte: startDate, lte: endDate };
  }

  // Fetch Data with Filters
  const payslips = await prisma.payslip.findMany({
    where: wherePayslip,
    include: { employee: true, payrun: true, contract: true }
  });

  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: whereTimeOff,
    include: { type: true }
  });

  const attendances = await prisma.attendance.findMany({
    where: whereAttendance
  });
  
  const employees = await prisma.employee.findMany({
    where: whereEmployee
  });

  // KPI 1. Total Net Paid
  const totalNetPaid = payslips.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.net, 0);

  // KPI 2. Payslips Generated & Breakdown
  const payslipsGenerated = payslips.length;
  const paidCount = payslips.filter(p => p.status === 'PAID').length;
  const pendingCount = payslipsGenerated - paidCount;

  // KPI 3. Average Salary
  const avgSalary = payslipsGenerated > 0 
    ? payslips.reduce((sum, p) => sum + p.net, 0) / payslipsGenerated 
    : 0;

  // KPI 4. Approved Time Off Days
  const approvedTimeOffDays = timeOffRequests
    .filter(r => r.status.toLowerCase() === 'approved')
    .reduce((sum, req) => sum + req.duration, 0);

  // KPI 5. Attendance Health%
  const totalAttendances = attendances.length;
  const presentAttendances = attendances.filter(a => a.status.toLowerCase() === 'present').length;
  const attendanceHealth = totalAttendances > 0 
    ? (presentAttendances / totalAttendances) * 100 
    : 0;

  // Chart 1: Salary Cost by Department
  const deptCostMap: Record<string, number> = {};
  payslips.forEach(p => {
    const dept = p.employee?.department || 'Unknown';
    deptCostMap[dept] = (deptCostMap[dept] || 0) + p.net;
  });
  const salaryCostByDept = Object.keys(deptCostMap).map(dept => ({ name: dept, value: deptCostMap[dept] }));

  // Chart 2: Monthly Net Salary Trend (Always show last 6 months regardless of period filter, but respect department filter)
  const trendWhere: any = {};
  if (department && department !== 'all') {
    trendWhere.employee = { department };
  }
  const trendDate = new Date();
  trendDate.setMonth(trendDate.getMonth() - 5);
  trendWhere.payrun = { periodStart: { gte: new Date(trendDate.getFullYear(), trendDate.getMonth(), 1) } };
  
  const allPayslipsForTrend = await prisma.payslip.findMany({
    where: trendWhere,
    include: { payrun: true }
  });
  
  const monthlyNetMap: Record<string, number> = {};
  allPayslipsForTrend.forEach(p => {
    const month = new Date(p.payrun.periodStart).toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyNetMap[month] = (monthlyNetMap[month] || 0) + p.net;
  });
  const monthlyNetTrend = Object.keys(monthlyNetMap).map(month => ({ name: month, value: monthlyNetMap[month] }));

  // Chart 3: Payslip Status & Payroll Alerts
  const statusCounts: Record<string, number> = {
    PAID: 0, VALIDATED: 0, COMPUTED: 0, DRAFT: 0, WARNING: 0
  };
  payslips.forEach(p => {
    if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
  });
  const payslipStatusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: payslipsGenerated > 0 ? (statusCounts[status] / payslipsGenerated) * 100 : 0
  }));

  // Alerts
  const missingBankWarnings = payslips.filter(p => p.warnings.some(w => w.toLowerCase().includes('bank'))).length;
  const duplicateWarnings = payslips.filter(p => p.warnings.some(w => w.toLowerCase().includes('duplicate'))).length;
  
  // Note: Payruns in DRAFT (ignoring period/dept filters as it's a global alert)
  const draftPayruns = await prisma.payrun.count({ where: { status: 'DRAFT' } });
  
  // Note: Expiring contracts in next 30 days
  const next30Days = new Date();
  next30Days.setDate(next30Days.getDate() + 30);
  const expiringContracts = await prisma.contract.count({
    where: { endDate: { lte: next30Days, gte: new Date() } }
  });

  // Bottom Row 1: Attendance Overview
  const lateCount = attendances.filter(a => a.status.toLowerCase() === 'late').length;
  const absentCount = attendances.filter(a => a.status.toLowerCase() === 'absent').length;
  const missingCheckOut = attendances.filter(a => a.checkIn && !a.checkOut).length;
  const manualEntries = attendances.filter(a => a.isManualEntry).length;

  // Bottom Row 2: Time Off Overview
  const allocations = await prisma.allocation.findMany({ include: { type: true } });
  
  const timeOffOverviewMap: Record<string, { approved: number, pending: number, remaining: number }> = {};
  timeOffRequests.forEach(r => {
    const typeName = r.type?.name || 'Unknown';
    if (!timeOffOverviewMap[typeName]) timeOffOverviewMap[typeName] = { approved: 0, pending: 0, remaining: 0 };
    if (r.status.toLowerCase() === 'approved') timeOffOverviewMap[typeName].approved += r.duration;
    if (r.status.toLowerCase() === 'pending') timeOffOverviewMap[typeName].pending++;
  });
  
  allocations.forEach(a => {
    const typeName = a.type?.name || 'Unknown';
    if (!timeOffOverviewMap[typeName]) timeOffOverviewMap[typeName] = { approved: 0, pending: 0, remaining: 0 };
    timeOffOverviewMap[typeName].remaining += a.remaining;
  });

  const timeOffOverview = Object.keys(timeOffOverviewMap).map(type => ({
    type,
    ...timeOffOverviewMap[type]
  }));

  // Bottom Row 3: Department Overview
  const deptOverviewMap: Record<string, { headcount: number, salary: number }> = {};
  employees.forEach(e => {
    if (!deptOverviewMap[e.department]) deptOverviewMap[e.department] = { headcount: 0, salary: 0 };
    deptOverviewMap[e.department].headcount++;
  });
  payslips.forEach(p => {
    const dept = p.employee?.department || 'Unknown';
    if (!deptOverviewMap[dept]) deptOverviewMap[dept] = { headcount: 0, salary: 0 };
    deptOverviewMap[dept].salary += p.net;
  });
  const deptOverview = Object.keys(deptOverviewMap).map(dept => ({
    department: dept,
    ...deptOverviewMap[dept]
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Dashboard</h1>
      </div>
      
      <PayrollDashboardFilters departments={departments} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Paid payslips only</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payslips Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslipsGenerated}</div>
            <p className="text-xs text-muted-foreground mt-1">{paidCount} paid, {pendingCount} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Salary / Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgSalary.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on net paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Time Off (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedTimeOffDays}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceHealth.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts 
        salaryCostByDept={salaryCostByDept} 
        monthlyNetTrend={monthlyNetTrend}
        payslipStatusData={payslipStatusData}
        alerts={{
          missingBankWarnings,
          duplicateWarnings,
          draftPayruns,
          expiringContracts
        }}
        attendanceOverview={{
          presentCount: presentAttendances,
          lateCount,
          absentCount,
          missingCheckOut,
          manualEntries
        }}
        timeOffOverview={timeOffOverview}
        deptOverview={deptOverview}
      />
    </div>
  );
}
