import { prisma } from '@/lib/prisma';
import { PayslipFilters } from '@/components/payroll/PayslipFilters';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default async function PayslipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; period?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const role = (session.user as any).role;
  const currentEmployeeId = (session.user as any).employeeId;
  const canReadAny = can(role, "payslip:read");

  const { q, period } = await searchParams;

  const where: Prisma.PayslipWhereInput = {};
  if (!canReadAny) {
    where.employeeId = currentEmployeeId || -1;
  }

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
      <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">Payslips</h1>
      
      <PayslipFilters />

      <Card className="premium-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Employee</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Warning</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Period</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Basic</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Gross</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Net</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Structure</TableHead>
                <TableHead className="text-muted-foreground font-medium uppercase text-xs tracking-wider">Status</TableHead>
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
                  <TableRow key={payslip.id} className="cursor-pointer relative border-border hover:bg-muted/50">
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
                        payslip.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        payslip.status === 'VALIDATED' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                        payslip.status === 'WARNING' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                        payslip.status === 'COMPUTED' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                        'bg-secondary text-secondary-foreground border border-border'
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
