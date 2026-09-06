import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { RequestList } from "@/components/time-off/RequestList";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const currentEmployeeId = (session.user as any).employeeId;
  const canApprove = can(role, "timeoff:approve");

  const whereClause = canApprove ? undefined : { employeeId: currentEmployeeId || -1 };

  const requests = await prisma.timeOffRequest.findMany({
    where: whereClause,
    include: {
      employee: { select: { id: true, name: true, managerId: true } },
      type: { select: { id: true, name: true, color: true } },
    },
    orderBy: [
      { startDate: 'desc' }
    ]
  });

  return (
    <div className="px-6 py-8">
      <RequestList 
        requests={requests} 
        canApprove={canApprove} 
        currentEmployeeId={currentEmployeeId || null} 
      />
    </div>
  );
}
