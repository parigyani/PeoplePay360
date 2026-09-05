import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import { RequestForm } from "@/components/time-off/RequestForm";

export default async function EditRequestPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/time-off/requests");
  }

  const reqId = parseInt(params.id, 10);
  if (isNaN(reqId)) {
    notFound();
  }

  const req = await prisma.timeOffRequest.findUnique({
    where: { id: reqId },
    include: { employee: true, type: true },
  });

  if (!req) {
    notFound();
  }

  const [employees, types] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.timeOffType.findMany({ select: { id: true, name: true, unit: true, requiresAllocation: true } }),
  ]);

  const initialData = {
    id: req.id,
    employeeId: req.employeeId.toString(),
    typeId: req.typeId.toString(),
    startDate: req.startDate,
    endDate: req.endDate,
    duration: req.duration,
    status: req.status,
    approverId: req.approverId?.toString() || "",
    reason: req.reason || "",
  };

  const approver = req.approverId 
    ? await prisma.user.findUnique({ where: { id: req.approverId } }) 
    : null;
    
  let allocationDesc = "None";
  if (req.type.requiresAllocation) {
    if (req.allocationId) {
      const alloc = await prisma.allocation.findUnique({ where: { id: req.allocationId } });
      allocationDesc = alloc ? `ID: ${alloc.id} - ${alloc.allocated} ${req.type.unit}` : "Unknown";
    } else {
      allocationDesc = req.status === "PENDING" ? "Pending Approval (Will Deduct)" : "Not Allocated";
    }
  }

  const canApprove = can((session.user as any).role, "timeoff:approve");

  return (
    <div className="container mx-auto py-10">
      <RequestForm 
        initialData={initialData} 
        employees={employees} 
        types={types} 
        employeeName={req.employee.name}
        approverName={approver?.email}
        allocationDesc={allocationDesc}
        canApprove={canApprove}
      />
    </div>
  );
}
