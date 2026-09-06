import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ContractForm } from "@/components/contracts/ContractForm";

export default async function NewContractPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "contract:write")) {
    redirect("/contracts");
  }

  const [employees, structures, schedules] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true, department: true, jobPosition: true } }),
    prisma.salaryStructure.findMany({ select: { id: true, name: true } }),
    prisma.workingSchedule.findMany({ select: { id: true, name: true, weeklyHours: true } }),
  ]);

  return (
    <div className="container mx-auto py-10">
      <ContractForm 
        employees={employees} 
        structures={structures} 
        schedules={schedules}
      />
    </div>
  );
}
