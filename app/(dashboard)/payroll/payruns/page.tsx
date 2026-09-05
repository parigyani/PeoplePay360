import { prisma } from '@/lib/prisma';
import { SendPayslipsButton } from '@/components/payroll/SendPayslipsButton';
import { PayrunsFilters } from '@/components/payroll/PayrunsFilters';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PayrunsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const { q, year } = await searchParams;

  const where: Prisma.PayrunWhereInput = {};
  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }
  if (year) {
    const yearNum = parseInt(year, 10);
    if (!isNaN(yearNum)) {
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      where.periodStart = {
        gte: startOfYear,
        lte: endOfYear
      };
    }
  }

  const payruns = await prisma.payrun.findMany({
    where,
    include: {
      _count: {
        select: { payslips: true }
      },
      payslips: {
        select: {
          status: true,
          warnings: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payruns</h1>
        <Link href="/payroll/payruns/new">
          <Button>+ New Payrun</Button>
        </Link>
      </div>
      
      <PayrunsFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Payslips</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payruns.map(payrun => {
                const warningsCount = payrun.payslips.filter(p => p.status === 'WARNING' || (Array.isArray(p.warnings) && p.warnings.length > 0)).length;

                return (
                  <TableRow key={payrun.id}>
                    <TableCell className="font-medium">{payrun.name}</TableCell>
                    <TableCell>
                      {new Date(payrun.periodStart).toLocaleDateString()} - {new Date(payrun.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payrun._count.payslips}</TableCell>
                    <TableCell>
                      <div className="font-medium">{payrun.status}</div>
                      {warningsCount > 0 ? (
                        <div className="text-xs font-semibold text-destructive mt-1">{warningsCount} {warningsCount === 1 ? 'warning' : 'warnings'}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1">No warnings</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 items-center">
                        <Link href={`/payroll/payruns/${payrun.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <SendPayslipsButton payrunId={payrun.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {payruns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payruns found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
