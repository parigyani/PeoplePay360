import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RequestForm } from "@/components/time-off/RequestForm";

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const types = await prisma.timeOffType.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });

  return (
    <div className="container mx-auto py-10">
      <RequestForm 
        employees={employees} 
        types={types} 
        canApprove={false} 
      />
    </div>
  );
}
