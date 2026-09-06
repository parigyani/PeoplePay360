import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ContractForm } from "@/components/contracts/ContractForm";

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "contract:write")) {
    redirect("/contracts");
  }

  const resolvedParams = await params;
  const contractId = parseInt(resolvedParams.id, 10);
  if (isNaN(contractId)) {
    notFound();
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    notFound();
  }

  const [employees, structures, schedules] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.salaryStructure.findMany({ select: { id: true, name: true } }),
    prisma.workingSchedule.findMany({ select: { id: true, name: true, weeklyHours: true } }),
  ]);

  const initialData = {
    id: contract.id,
    employeeId: contract.employeeId.toString(),
    department: contract.department,
    jobPosition: contract.jobPosition,
    wage: contract.wage,
    startDate: contract.startDate,
    endDate: contract.endDate,
    structureId: contract.structureId.toString(),
    scheduleId: "", // we don't store it on contract, so keep empty for "Leave unchanged"
    status: contract.status,
    code: contract.code,
  };

  return (
    <div className="container mx-auto py-10">
      <ContractForm 
        initialData={initialData}
        employees={employees} 
        structures={structures} 
        schedules={schedules}
      />
    </div>
  );
}
