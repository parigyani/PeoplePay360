import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { redirect, notFound } from "next/navigation";
import { EmployeeDetailView } from "@/components/employees/EmployeeDetailView";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    notFound();
  }

  const role = (session.user as any).role;
  const canEdit = can(role, "employee:write");

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      manager: true,
      schedule: true,
    },
  });

  if (!employee) {
    notFound();
  }

  // Fetch counts for smart buttons
  const [contractCount, timeOffCount, attendanceCount] = await Promise.all([
    prisma.contract.count({ where: { employeeId: id } }),
    prisma.timeOffRequest.count({ where: { employeeId: id } }),
    prisma.attendance.count({ where: { employeeId: id } }),
  ]);

  // Fetch all employees and schedules for edit dropdowns
  const [allEmployees, allSchedules] = await Promise.all([
    prisma.employee.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.workingSchedule.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize
  const serializedEmployee = {
    ...employee,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
    manager: employee.manager
      ? {
          ...employee.manager,
          createdAt: employee.manager.createdAt.toISOString(),
          updatedAt: employee.manager.updatedAt.toISOString(),
        }
      : null,
    schedule: employee.schedule
      ? {
          ...employee.schedule,
          createdAt: employee.schedule.createdAt.toISOString(),
          updatedAt: employee.schedule.updatedAt.toISOString(),
        }
      : null,
  };

  const serializedSchedules = allSchedules.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="px-6 py-8">
      <EmployeeDetailView
        employee={serializedEmployee}
        allEmployees={allEmployees}
        allSchedules={serializedSchedules}
        counts={{
          contracts: contractCount,
          timeOff: timeOffCount,
          attendance: attendanceCount,
        }}
        canEdit={canEdit}
      />
    </div>
  );
}
