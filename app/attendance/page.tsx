import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
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

export default async function AttendanceListPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canWrite = can(role, "attendance:write");

  const resolvedSearchParams = await searchParams;

  // Non-privileged users (like EMPLOYEE) can only see their own attendance
  // unless they are explicitly looking at someone else and have HR access.
  // We'll trust the middleware/rbac to block whole pages, but here we enforce view boundaries:
  let targetEmployeeId: number | undefined = undefined;
  
  if (role === "EMPLOYEE") {
    targetEmployeeId = (session.user as any).employeeId;
  } else if (resolvedSearchParams.employeeId) {
    targetEmployeeId = parseInt(resolvedSearchParams.employeeId, 10);
  }

  const whereClause = targetEmployeeId ? { employeeId: targetEmployeeId } : {};

  const attendances = await prisma.attendance.findMany({
    where: whereClause,
    include: {
      employee: true,
    },
    orderBy: {
      checkIn: 'desc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        {canWrite && (
          <Link href="/attendance/new">
            <Button>Add Manual Entry</Button>
          </Link>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Worked Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              attendances.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.employee.name}
                  </TableCell>
                  <TableCell>{format(new Date(record.checkIn), "PPP p")}</TableCell>
                  <TableCell>
                    {record.checkOut
                      ? format(new Date(record.checkOut), "PPP p")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {record.workedHours !== null ? record.workedHours.toFixed(2) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{record.status}</Badge>
                      {record.isManualEntry && (
                        <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">
                          Manual Correction
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite && (
                      <Link href={`/attendance/${record.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
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
