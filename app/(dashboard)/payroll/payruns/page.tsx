import { prisma } from '@/lib/prisma';
import { SendPayslipsButton } from '@/components/payroll/SendPayslipsButton';
import { PayrunsFilters } from '@/components/payroll/PayrunsFilters';
import { Prisma } from '@prisma/client';
import Link from 'next/link';

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
        <Link href="/payroll/payruns/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors">
          + New Payrun
        </Link>
      </div>
      
      <PayrunsFilters />

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payslips</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payruns.map(payrun => {
              const warningsCount = payrun.payslips.filter(p => p.status === 'WARNING' || (Array.isArray(p.warnings) && p.warnings.length > 0)).length;

              return (
                <tr key={payrun.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payrun.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payrun.periodStart).toLocaleDateString()} - {new Date(payrun.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payrun._count.payslips}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">{payrun.status}</div>
                    {warningsCount > 0 ? (
                      <div className="text-xs font-semibold text-red-600 mt-1">{warningsCount} {warningsCount === 1 ? 'warning' : 'warnings'}</div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">No warnings</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3 items-center">
                    <Link href={`/payroll/payruns/${payrun.id}`} className="text-blue-600 hover:text-blue-900 transition-colors">View</Link>
                    <SendPayslipsButton payrunId={payrun.id} />
                  </td>
                </tr>
              );
            })}
            {payruns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payruns found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
