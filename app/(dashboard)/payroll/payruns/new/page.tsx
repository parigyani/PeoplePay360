import { prisma } from "@/lib/prisma";
import { PayrunWizard } from "@/components/payroll/PayrunWizard";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";

export default async function NewPayrunPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "payrun:write")) {
    redirect("/login");
  }

  const structures = await prisma.salaryStructure.findMany({
    select: { id: true, name: true }
  });

  const employees = await prisma.employee.findMany({
    where: { status: "Active" },
    select: { id: true, name: true, department: true, status: true }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Payrun</h1>
      <PayrunWizard structures={structures} employees={employees as any} />
    </div>
  );
}
