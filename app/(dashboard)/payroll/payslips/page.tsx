import { prisma } from '@/lib/prisma';
import { PrintPayslipButton } from '@/components/payroll/PrintPayslipButton';

export default async function PayslipsPage() {
  const payslips = await prisma.payslip.findMany({
    include: {
      employee: true,
      payrun: true,
    }
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payslips</h1>
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payrun</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payslips.map(payslip => (
              <tr key={payslip.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payslip.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payslip.employee.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payslip.payrun.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payslip.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payslip.net.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <PrintPayslipButton payslipId={payslip.id} />
                </td>
              </tr>
            ))}
            {payslips.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No payslips found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
