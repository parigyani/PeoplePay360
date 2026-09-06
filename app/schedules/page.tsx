import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { SchedulesView } from "@/components/schedules/SchedulesView";

export default async function SchedulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canWrite = can(role, "schedule:write");
  const canRead = can(role, "schedule:read") || canWrite;

  if (!canRead) return <div className="p-8 text-center">Unauthorized</div>;

  const isAdmin = role === "ADMIN";

  const schedules = await prisma.workingSchedule.findMany({
    include: {
      _count: {
        select: { employees: true },
      },
      patterns: true,
      employees: isAdmin ? {
        select: {
          id: true,
          name: true,
          department: true,
          jobPosition: true,
        }
      } : false,
    },
    orderBy: {
      name: 'asc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Working Schedules</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage working schedules and patterns for employees.</p>
      </div>

      <SchedulesView schedules={schedules} canWrite={canWrite} isAdmin={isAdmin} />
    </div>
  );
}
