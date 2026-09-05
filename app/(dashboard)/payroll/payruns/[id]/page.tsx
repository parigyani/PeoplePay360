import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PayrunActions } from "./PayrunActions";
import { format } from "date-fns";

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
        <PayrunActions payrunId={payrun.id} status={payrun.status} />
      </div>

      <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Net</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Warnings</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payrun.payslips.map(payslip => (
              <tr key={payslip.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">{payslip.employee.name}</td>
                <td className="px-4 py-3">${payslip.gross.toFixed(2)}</td>
                <td className="px-4 py-3">${payslip.net.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payslip.status === "WARNING" ? "bg-red-100 text-red-800" :
                    payslip.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {payslip.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-red-600 max-w-xs truncate" title={payslip.warnings.join(", ")}>
                  {payslip.warnings.length > 0 ? payslip.warnings.join(", ") : "-"}
                </td>
              </tr>
            ))}
            {payrun.payslips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No payslips found for this payrun.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
