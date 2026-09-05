import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";
import { RequestForm } from "@/components/time-off/RequestForm";

export const dynamic = "force-dynamic";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      allocation: true,
    }
  });

  if (!request) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const types = await prisma.timeOffType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div className="container mx-auto py-10">
      <RequestForm 
        initialData={request} 
        employees={employees} 
        types={types} 
        canApprove={canApprove} 
      />
    </div>
  );
}
