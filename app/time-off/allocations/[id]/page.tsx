import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AllocationForm } from "@/components/time-off/AllocationForm";

export default async function EditAllocationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "timeoff:configure")) {
    redirect("/time-off/allocations");
  }

  const allocId = parseInt(params.id, 10);
  if (isNaN(allocId)) {
    notFound();
  }

  const allocation = await prisma.allocation.findUnique({
    where: { id: allocId },
    include: { employee: true },
  });

  if (!allocation) {
    notFound();
  }

  const [employees, types] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.timeOffType.findMany({ 
      where: { requiresAllocation: true },
      select: { id: true, name: true } 
    }),
  ]);

  const initialData = {
    id: allocation.id,
    employeeId: allocation.employeeId.toString(),
    typeId: allocation.typeId.toString(),
    allocated: allocation.allocated,
    taken: allocation.taken,
    remaining: allocation.remaining,
    validFrom: allocation.validFrom,
    validTo: allocation.validTo,
    status: allocation.status,
    description: allocation.description || "",
    approverId: allocation.approverId?.toString() || "",
  };

  const approver = allocation.approverId 
    ? await prisma.user.findUnique({ where: { id: allocation.approverId } })
    : null;
    
  const canApprove = can((session.user as any).role, "timeoff:approve");

  return (
    <div className="container mx-auto py-10">
      <AllocationForm 
        initialData={initialData} 
        employees={employees} 
        types={types} 
        employeeName={allocation.employee.name}
        approverName={approver?.email}
        canApprove={canApprove}
      />
    </div>
  );
}
