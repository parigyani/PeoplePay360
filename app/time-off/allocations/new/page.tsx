import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { AllocationForm } from "@/components/time-off/AllocationForm";

export const dynamic = "force-dynamic";

export default async function NewAllocationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!can(role, "timeoff:configure")) {
    redirect("/time-off/allocations");
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const types = await prisma.timeOffType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div className="container mx-auto py-10">
      <AllocationForm 
        employees={employees} 
        types={types} 
        canApprove={false} 
      />
    </div>
  );
}
