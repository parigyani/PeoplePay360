import { prisma } from '@/lib/prisma';
import { PayslipFilters } from '@/components/payroll/PayslipFilters';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string }>;
}) {
  const { q, period } = await searchParams;

  const where: Prisma.PayslipWhereInput = {};
  if (q) {
    where.employee = { name: { contains: q, mode: 'insensitive' } };
  }
  if (period) {
    // period is like '2026-02'. We want any payrun that overlaps with this month.
    const year = parseInt(period.split('-')[0], 10);
    const month = parseInt(period.split('-')[1], 10) - 1;
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    where.payrun = {
      periodStart: { lte: endOfMonth },
      periodEnd: { gte: startOfMonth },
    };
  }

  const payslips = await prisma.payslip.findMany({
    where,
    include: {
      employee: true,
      payrun: { include: { structure: true } },
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payslips</h1>
      
      <PayslipFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Warning</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Basic</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map(payslip => {
                const lines = payslip.lines as any[] || [];
                const basicLine = lines.find(l => l.code === 'BASIC');
                const basicAmount = basicLine ? `$${Number(basicLine.amount).toFixed(2)}` : '—';
                const firstWarning = payslip.warnings && payslip.warnings.length > 0 ? payslip.warnings[0] : '—';
                const periodStr = `${payslip.payrun.periodStart.toLocaleDateString()} – ${payslip.payrun.periodEnd.toLocaleDateString()}`;

                return (
                  <TableRow key={payslip.id} className="cursor-pointer relative">
                    <TableCell className="font-medium">
                      <Link href={`/payroll/payslips/${payslip.id}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View Payslip {payslip.id}</span>
                      </Link>
                      {payslip.employee.name}
                    </TableCell>
                    <TableCell className="text-destructive truncate max-w-[150px]" title={firstWarning}>{firstWarning}</TableCell>
                    <TableCell>{periodStr}</TableCell>
                    <TableCell>{basicAmount}</TableCell>
                    <TableCell>${payslip.gross.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${payslip.net.toFixed(2)}</TableCell>
                    <TableCell>{payslip.payrun.structure?.name || '—'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payslip.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        payslip.status === 'VALIDATED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        payslip.status === 'WARNING' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        payslip.status === 'COMPUTED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {payslip.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payslips found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
