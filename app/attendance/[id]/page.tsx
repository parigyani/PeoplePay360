import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";

export default async function EditAttendancePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "attendance:write")) {
    redirect("/attendance");
  }

  const attendanceId = parseInt(params.id, 10);
  if (isNaN(attendanceId)) {
    notFound();
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!attendance) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ select: { id: true, name: true } });

  const initialData = {
    id: attendance.id,
    employeeId: attendance.employeeId.toString(),
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    workedHours: attendance.workedHours,
    status: attendance.status,
  };

  return (
    <div className="container mx-auto py-10">
      <AttendanceForm 
        initialData={initialData}
        employees={employees} 
      />
    </div>
  );
}
