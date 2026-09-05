import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { EmployeeClientView } from "./EmployeeClientView";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const canEdit = can(role, "employee:write");

  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      manager: true,
      schedule: true,
    },
  });

  const schedules = await prisma.workingSchedule.findMany({
    orderBy: { name: "asc" },
  });

  // Serialize dates for client component
  const serializedEmployees = employees.map((emp) => ({
    ...emp,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
    manager: emp.manager
      ? {
          ...emp.manager,
          createdAt: emp.manager.createdAt.toISOString(),
          updatedAt: emp.manager.updatedAt.toISOString(),
        }
      : null,
    schedule: emp.schedule
      ? {
          ...emp.schedule,
          createdAt: emp.schedule.createdAt.toISOString(),
          updatedAt: emp.schedule.updatedAt.toISOString(),
        }
      : null,
  }));

  const serializedSchedules = schedules.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="px-6 py-8">
      <EmployeeClientView
        employees={serializedEmployees}
        schedules={serializedSchedules}
        canEdit={canEdit}
      />
    </div>
  );
}
