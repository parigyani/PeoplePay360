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

  // Fetch employees and schedules
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      manager: true,
      schedule: true,
    }
  });

  const schedules = await prisma.workingSchedule.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="container mx-auto py-10">
      <EmployeeClientView
        employees={employees}
        schedules={schedules}
        canEdit={canEdit}
      />
    </div>
  );
}
