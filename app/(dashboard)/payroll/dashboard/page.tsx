import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardCharts } from './DashboardCharts';

export default async function PayrollDashboard() {
  // 1. Total Net Paid
  const payslips = await prisma.payslip.findMany({
    include: { employee: true, payrun: true }
  });
  
  const totalNetPaid = payslips.reduce((sum, p) => sum + p.net, 0);

  // 2. Payslips Generated
  const payslipsGenerated = payslips.length;

  // 3. Average Salary
  const contracts = await prisma.contract.findMany();
  const avgSalary = contracts.length > 0 
    ? contracts.reduce((sum, c) => sum + c.wage, 0) / contracts.length 
    : 0;

  // 4. Approved Time Off Days
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: { status: 'Approved' }
  });
  const approvedTimeOffDays = timeOffRequests.reduce((sum, req) => sum + req.duration, 0);

  // 5. Attendance Health%
  // Defined as percentage of records with status "Present" out of all attendance records.
  // This gives a quick indication of workforce attendance reliability.
  const attendances = await prisma.attendance.findMany();
  const totalAttendances = attendances.length;
  const presentAttendances = attendances.filter(a => a.status === 'Present').length;
  const attendanceHealth = totalAttendances > 0 
    ? (presentAttendances / totalAttendances) * 100 
    : 0;

  // Chart 1: Salary Cost by Department
  // Group Contract.wage by Employee.department
  const employeesWithContracts = await prisma.employee.findMany({
    include: { contracts: true }
  });
  
  const deptCostMap: Record<string, number> = {};
  employeesWithContracts.forEach(emp => {
    // Basic fallback if active status is different or missing
    const activeContract = emp.contracts.find(c => c.status === 'Active' || c.status === 'ACTIVE') || emp.contracts[0];
    if (activeContract) {
      deptCostMap[emp.department] = (deptCostMap[emp.department] || 0) + activeContract.wage;
    }
  });
  
  const salaryCostByDept = Object.keys(deptCostMap).map(dept => ({
    name: dept,
    value: deptCostMap[dept]
  }));

  // Chart 2: Monthly Net Salary Trend
  // Group Payslip.net by month
  const monthlyNetMap: Record<string, number> = {};
  payslips.forEach(p => {
    const month = new Date(p.payrun.periodStart).toLocaleString('default', { month: 'short', year: 'numeric' });
    monthlyNetMap[month] = (monthlyNetMap[month] || 0) + p.net;
  });

  const monthlyNetTrend = Object.keys(monthlyNetMap).map(month => ({
    name: month,
    value: monthlyNetMap[month]
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Payroll Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalNetPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payslips Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payslipsGenerated}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgSalary.toFixed(2)}</div>
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
      />
    </div>
  );
}
