import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function SchedulesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canWrite = can(role, "schedule:write");
  const canRead = can(role, "schedule:read") || canWrite;

  if (!canRead) return <div className="p-8 text-center">Unauthorized</div>;

  const schedules = await prisma.workingSchedule.findMany({
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: {
      name: 'asc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Working Schedules</h1>
        {canWrite && (
          <Link href="/schedules/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              New Schedule
            </Button>
          </Link>
        )}
      </div>

      <div className="glass-card rounded-md border border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/[0.08]">
              <TableHead>Name</TableHead>
              <TableHead>Calendar Type</TableHead>
              <TableHead>Weekly Hours</TableHead>
              <TableHead>Employees Assigned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No working schedules found.
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow 
                  key={schedule.id} 
                  className="border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="font-medium">
                    {schedule.name}
                  </TableCell>
                  <TableCell>
                    {schedule.type === "Standard" && (
                      <Badge variant="default" className="bg-blue-600/20 text-blue-400 border border-blue-600/50">Standard</Badge>
                    )}
                    {schedule.type === "Shift" && (
                      <Badge variant="default" className="bg-purple-600/20 text-purple-400 border border-purple-600/50">Shift</Badge>
                    )}
                    {schedule.type === "Flexible" && (
                      <Badge variant="default" className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/50">Flexible</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">{schedule.weeklyHours}</span> <span className="text-muted-foreground text-sm">h / Week</span>
                  </TableCell>
                  <TableCell>
                    {schedule._count.employees} employees
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite ? (
                      <Link href={`/schedules/${schedule.id}`}>
                        <Button variant="outline" size="sm" className="bg-white/[0.03] border-white/[0.1] hover:bg-white/[0.08]">
                          Edit
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">View Only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
