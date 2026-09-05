import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RequestForm } from "@/components/time-off/RequestForm";

export default async function NewRequestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/time-off/requests");
  }

  const [employees, types] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.timeOffType.findMany({ select: { id: true, name: true, unit: true } }),
  ]);

  return (
    <div className="container mx-auto py-10">
      <RequestForm employees={employees} types={types} />
    </div>
  );
}
