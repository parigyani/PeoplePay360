import fs from 'fs';
import path from 'path';

const content = `'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  salaryCostByDept: { name: string; value: number }[];
  monthlyNetTrend: { name: string; value: number }[];
  payslipStatusData: { name: string; value: number }[];
  alerts: {
    missingBankWarnings: number;
    duplicateWarnings: number;
    draftPayruns: number;
    expiringContracts: number;
  };
  attendanceOverview: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    missingCheckOut: number;
    manualEntries: number;
  };
  timeOffOverview: {
    type: string;
    approved: number;
    pending: number;
    remaining: number;
  }[];
  deptOverview: {
    department: string;
    headcount: number;
    salary: number;
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export function DashboardCharts({ 
  salaryCostByDept, 
  monthlyNetTrend,
  payslipStatusData,
  alerts,
  attendanceOverview,
  timeOffOverview,
  deptOverview
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Salary Cost by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryCostByDept}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => \`\$\${Number(value).toFixed(2)}\`} />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Net Salary Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyNetTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => \`\$\${Number(value).toFixed(2)}\`} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payslip Status (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payslipStatusData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => \`\${Number(value).toFixed(1)}%\`} />
                  <Bar dataKey="value" fill="#8b5cf6">
                    {payslipStatusData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payroll Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex justify-between items-center">
                <span className="text-sm font-medium">Missing Bank Details</span>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">{alerts.missingBankWarnings}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm font-medium">Duplicate Payslip Warnings</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">{alerts.duplicateWarnings}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm font-medium">Draft Payruns</span>
                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded">{alerts.draftPayruns}</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="text-sm font-medium">Expiring Contracts (30 days)</span>
                <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">{alerts.expiringContracts}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex justify-between text-sm">
                <span>Present</span>
                <span className="font-semibold">{attendanceOverview.presentCount}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span>Late</span>
                <span className="font-semibold text-yellow-600">{attendanceOverview.lateCount}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span>Absent</span>
                <span className="font-semibold text-red-600">{attendanceOverview.absentCount}</span>
              </li>
              <li className="flex justify-between text-sm border-t pt-3 mt-3">
                <span>Missing Check-outs</span>
                <span className="font-semibold">{attendanceOverview.missingCheckOut}</span>
              </li>
              <li className="flex justify-between text-sm">
                <span>Manual Entries</span>
                <span className="font-semibold">{attendanceOverview.manualEntries}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Off Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {timeOffOverview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Appr.</TableHead>
                    <TableHead className="text-right">Pend.</TableHead>
                    <TableHead className="text-right">Bal.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOffOverview.map((item) => (
                    <TableRow key={item.type}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell className="text-right">{item.approved}</TableCell>
                      <TableCell className="text-right">{item.pending}</TableCell>
                      <TableCell className="text-right">{item.remaining}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No time off data found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {deptOverview.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Headcount</TableHead>
                    <TableHead className="text-right">Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deptOverview.map((item) => (
                    <TableRow key={item.department}>
                      <TableCell className="font-medium">{item.department}</TableCell>
                      <TableCell className="text-right">{item.headcount}</TableCell>
                      <TableCell className="text-right">\$\{(item.salary || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No department data found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('/Users/utkarsingh/Documents/PeoplePay360/app/(dashboard)/payroll/dashboard/DashboardCharts.tsx', content);
