import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AllocationForm } from "@/components/time-off/AllocationForm";

export default async function NewAllocationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "timeoff:configure")) {
    redirect("/time-off/allocations");
  }

  const [employees, types] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.timeOffType.findMany({ 
      where: { requiresAllocation: true },
      select: { id: true, name: true } 
    }),
  ]);

  return (
    <div className="container mx-auto py-10">
      <AllocationForm employees={employees} types={types} />
    </div>
  );
}
