import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  });

  if (!req) {
    notFound();
  }

  const [employees, types] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.timeOffType.findMany({ select: { id: true, name: true, unit: true } }),
  ]);

  const initialData = {
    id: req.id,
    employeeId: req.employeeId.toString(),
    typeId: req.typeId.toString(),
    startDate: req.startDate,
    endDate: req.endDate,
    duration: req.duration,
    status: req.status,
  };

  return (
    <div className="container mx-auto py-10">
      <RequestForm 
        initialData={initialData} 
        employees={employees} 
        types={types} 
      />
    </div>
  );
}
