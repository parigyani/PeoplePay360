import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PrintPayslipButton } from '@/components/payroll/PrintPayslipButton';
import { PayrunActions } from '@/app/(dashboard)/payroll/payruns/[id]/PayrunActions';

export default async function PayslipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const payslip = await prisma.payslip.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      employee: true,
      payrun: { include: { structure: true } },
    }
  });

  if (!payslip) {
    return notFound();
  }

  const periodStr = `${payslip.payrun.periodStart.toLocaleDateString()} – ${payslip.payrun.periodEnd.toLocaleDateString()}`;
  const lines = payslip.lines as any[] || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Payslip / {payslip.employee.name} / {periodStr}</h1>
        
        <div className="flex gap-2 items-center">
          {/* Reuse existing Payrun functionality */}
          <PayrunActions payrunId={payslip.payrunId} status={payslip.payrun.status as any} />
          <PrintPayslipButton payslipId={payslip.id} />
        </div>
      </div>
      
      {payslip.warnings && payslip.warnings.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <h3 className="font-semibold mb-2">Warnings</h3>
          <ul className="list-disc pl-5 space-y-1">
            {payslip.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 shadow rounded-lg border border-gray-200 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Employee Details</h3>
          <div className="flex justify-between"><span className="text-gray-500">Employee:</span> <span className="font-medium">{payslip.employee.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Department:</span> <span className="font-medium">{payslip.employee.department}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Worked Days:</span> <span className="font-medium">{payslip.workedDays}</span></div>
        </div>
        
        <div className="bg-white p-5 shadow rounded-lg border border-gray-200 space-y-3">
          <h3 className="text-lg font-semibold border-b pb-2 mb-3">Payrun Details</h3>
          <div className="flex justify-between"><span className="text-gray-500">Pay Run:</span> <span className="font-medium">{payslip.payrun.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Period:</span> <span className="font-medium">{periodStr}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Structure:</span> <span className="font-medium">{payslip.payrun.structure?.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Status:</span> 
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              payslip.status === 'PAID' ? 'bg-green-100 text-green-800' :
              payslip.status === 'VALIDATED' ? 'bg-blue-100 text-blue-800' :
              payslip.status === 'WARNING' ? 'bg-red-100 text-red-800' :
              payslip.status === 'COMPUTED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {payslip.status}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold">Salary Computation</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{line.code}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{line.name}</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">${Number(line.amount).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right uppercase">Net Salary</td>
              <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-green-700 text-right">${payslip.net.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
