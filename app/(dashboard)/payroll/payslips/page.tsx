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
    <div className="container mx-auto py-10 space-y-6 max-w-7xl px-6">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Payslips</h1>
      
      <PayslipFilters />

      <Card className="premium-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-900/90 backdrop-blur-sm border-b border-white/[0.06]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground/80">Employee</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Warning</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Period</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Basic</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Gross</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Net</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Structure</TableHead>
                <TableHead className="font-medium text-muted-foreground/80">Status</TableHead>
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
                  <TableRow key={payslip.id} className="cursor-pointer relative border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell className="font-semibold text-foreground">
                      <Link href={`/payroll/payslips/${payslip.id}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View Payslip {payslip.id}</span>
                      </Link>
                      {payslip.employee.name}
                    </TableCell>
                    <TableCell className="text-destructive truncate max-w-[150px]" title={firstWarning}>{firstWarning}</TableCell>
                    <TableCell className="text-muted-foreground">{periodStr}</TableCell>
                    <TableCell className="text-muted-foreground">{basicAmount}</TableCell>
                    <TableCell className="text-muted-foreground">${payslip.gross.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-foreground">${payslip.net.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{payslip.payrun.structure?.name || '—'}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                        payslip.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        payslip.status === 'VALIDATED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        payslip.status === 'WARNING' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        payslip.status === 'COMPUTED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {payslip.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">No payslips found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
