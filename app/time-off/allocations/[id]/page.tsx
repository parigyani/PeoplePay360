import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";
import { AllocationForm } from "@/components/time-off/AllocationForm";

export const dynamic = "force-dynamic";

export default async function AllocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const canApprove = can(role, "timeoff:approve");

  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    notFound();
  }

  const allocation = await prisma.allocation.findUnique({
    where: { id },
  });

  if (!allocation) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const types = await prisma.timeOffType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div className="container mx-auto py-10">
      <AllocationForm 
        initialData={allocation} 
        employees={employees} 
        types={types} 
        canApprove={canApprove} 
      />
    </div>
  );
}
