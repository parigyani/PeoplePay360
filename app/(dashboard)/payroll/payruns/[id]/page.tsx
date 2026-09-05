import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PayrunActions } from "./PayrunActions";
import { format } from "date-fns";
import { SendPayslipsButton } from "@/components/payroll/SendPayslipsButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default async function PayrunDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const payrunId = parseInt(id, 10);
  
  if (isNaN(payrunId)) return notFound();

  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: {
          employee: true
        }
      }
    }
  });

  if (!payrun) return notFound();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{payrun.name}</h1>
          <p className="text-muted-foreground mt-1">
            Period: {format(new Date(payrun.periodStart), "PP")} - {format(new Date(payrun.periodEnd), "PP")}
          </p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
            Status: {payrun.status}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <PayrunActions payrunId={payrun.id} status={payrun.status} />
          <SendPayslipsButton payrunId={payrun.id} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Warnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrun.payslips.map(payslip => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">{payslip.employee.name}</TableCell>
                  <TableCell>${payslip.gross.toFixed(2)}</TableCell>
                  <TableCell>${payslip.net.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payslip.status === "WARNING" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                      payslip.status === "DRAFT" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" :
                      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {payslip.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-destructive max-w-[200px] truncate" title={payslip.warnings.join(", ")}>
                    {payslip.warnings.length > 0 ? payslip.warnings[0] : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {payrun.payslips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No payslips found for this payrun.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
