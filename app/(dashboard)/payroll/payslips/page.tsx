import { prisma } from '@/lib/prisma';
import { PayslipFilters } from '@/components/payroll/PayslipFilters';
import Link from 'next/link';
import { Prisma } from '@prisma/client';

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

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warning</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payslips.map(payslip => {
              const lines = payslip.lines as any[] || [];
              const basicLine = lines.find(l => l.code === 'BASIC');
              const basicAmount = basicLine ? `$${Number(basicLine.amount).toFixed(2)}` : '—';
              const firstWarning = payslip.warnings && payslip.warnings.length > 0 ? payslip.warnings[0] : '—';
              const periodStr = `${payslip.payrun.periodStart.toLocaleDateString()} – ${payslip.payrun.periodEnd.toLocaleDateString()}`;

              return (
                <tr key={payslip.id} className="hover:bg-gray-50 cursor-pointer transition-colors relative">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link href={`/payroll/payslips/${payslip.id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">View Payslip {payslip.id}</span>
                    </Link>
                    {payslip.employee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 truncate max-w-[150px]" title={firstWarning}>{firstWarning}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{periodStr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{basicAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payslip.gross.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${payslip.net.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payslip.payrun.structure?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payslip.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      payslip.status === 'VALIDATED' ? 'bg-blue-100 text-blue-800' :
                      payslip.status === 'WARNING' ? 'bg-red-100 text-red-800' :
                      payslip.status === 'COMPUTED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payslip.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {payslips.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No payslips found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
