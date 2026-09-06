import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AttendanceDetailView } from "@/components/attendance/AttendanceDetailView";

export default async function EditAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "attendance:write")) {
    redirect("/attendance");
  }

  const p = await params;
  const attendanceId = parseInt(p.id, 10);
  if (isNaN(attendanceId)) {
    notFound();
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      employee: {
        include: { manager: true, schedule: true }
      }
    }
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
      <AttendanceDetailView 
        initialData={initialData}
        employees={employees}
        employeeDetails={attendance.employee}
      />
    </div>
  );
}
