import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";

export default async function NewAttendancePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "attendance:write")) {
    redirect("/attendance");
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true } });

  return (
    <div className="container mx-auto py-10">
      <AttendanceForm employees={employees} />
    </div>
  );
}
