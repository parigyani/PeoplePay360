import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { can } from "@/lib/rbac";
import { AllocationList } from "@/components/time-off/AllocationList";

export const dynamic = "force-dynamic";

export default async function AllocationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const canApprove = can(role, "timeoff:approve");

  const allocations = await prisma.allocation.findMany({
    include: {
      employee: { select: { name: true } },
      type: { select: { name: true, color: true } },
    },
    orderBy: [
      { employee: { name: 'asc' } },
      { type: { name: 'asc' } }
    ]
  });

  return (
    <div className="px-6 py-8">
      <AllocationList allocations={allocations} canApprove={canApprove} />
    </div>
  );
}
