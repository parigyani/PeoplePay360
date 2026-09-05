import { prisma } from '@/lib/prisma';
import { SendPayslipsButton } from '@/components/payroll/SendPayslipsButton';

export default async function PayrunsPage() {
  const payruns = await prisma.payrun.findMany({
    include: {
      _count: {
        select: { payslips: true }
      }
    }
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payruns</h1>
        <a href="/payroll/payruns/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm">
          + New Payrun
        </a>
      </div>
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payslips</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payruns.map(payrun => (
              <tr key={payrun.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payrun.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payrun.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payrun.periodStart).toLocaleDateString()} - {new Date(payrun.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payrun._count.payslips}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payrun.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <SendPayslipsButton payrunId={payrun.id} />
                </td>
              </tr>
            ))}
            {payruns.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No payruns found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
