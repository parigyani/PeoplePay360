import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintPayslipButton } from '@/components/payroll/PrintPayslipButton';
import { PayrunActions } from '@/app/(dashboard)/payroll/payruns/[id]/PayrunActions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const payslip = await prisma.payslip.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      employee: true,
      payrun: { include: { structure: true } },
    }
  });

  if (!payslip) {
    return notFound();
  }

  const periodStr = `${payslip.payrun.periodStart.toLocaleDateString()} – ${payslip.payrun.periodEnd.toLocaleDateString()}`;
  const lines = payslip.lines as any[] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Payslip / {payslip.employee.name} / {periodStr}</h1>
        
        <div className="flex gap-2 items-center">
          {/* Reuse existing Payrun functionality */}
          <PayrunActions payrunId={payslip.payrunId} status={payslip.payrun.status as any} />
          <PrintPayslipButton payslipId={payslip.id} />
        </div>
      </div>
      
      {payslip.warnings && payslip.warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <h3 className="font-semibold mb-2">Warnings</h3>
          <ul className="list-disc pl-5 space-y-1">
            {payslip.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b pb-2 mb-3">
            <CardTitle className="text-lg">Employee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{payslip.employee.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Department:</span> <span className="font-medium">{payslip.employee.department}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Worked Days:</span> <span className="font-medium">{payslip.workedDays}</span></div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="border-b pb-2 mb-3">
            <CardTitle className="text-lg">Payrun Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Pay Run:</span> <span className="font-medium">{payslip.payrun.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Period:</span> <span className="font-medium">{periodStr}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Structure:</span> <span className="font-medium">{payslip.payrun.structure?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status:</span> 
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                payslip.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                payslip.status === 'VALIDATED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                payslip.status === 'WARNING' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                payslip.status === 'COMPUTED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {payslip.status}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg">Salary Computation</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-muted-foreground">{line.code}</TableCell>
                  <TableCell className="font-medium">{line.name}</TableCell>
                  <TableCell className="text-right">${Number(line.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="font-bold text-right uppercase">Net Salary</TableCell>
                <TableCell className="text-lg font-bold text-green-600 dark:text-green-500 text-right">${payslip.net.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
