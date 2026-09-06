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
import { AttendanceListFilters } from "@/components/attendance/AttendanceListFilters";

export default async function AttendanceListPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string; search?: string; date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const params = await searchParams;

  const role = (session.user as any).role;
  const canWrite = can(role, "attendance:write");

  let targetEmployeeId: number | undefined = undefined;
  let employeeName: string | undefined = undefined;
  
  if (role === "EMPLOYEE") {
    targetEmployeeId = (session.user as any).employeeId;
  } else if (params.employeeId) {
    targetEmployeeId = parseInt(params.employeeId, 10);
  }

  const whereClause: any = {};
  
  if (targetEmployeeId) {
    whereClause.employeeId = targetEmployeeId;
    const emp = await prisma.employee.findUnique({ where: { id: targetEmployeeId }, select: { name: true }});
    if (emp) employeeName = emp.name;
  }

  if (params.search) {
    whereClause.employee = {
      name: { contains: params.search, mode: "insensitive" }
    };
  }

  if (params.date) {
    const startOfDay = new Date(params.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(params.date);
    endOfDay.setHours(23, 59, 59, 999);
    
    whereClause.checkIn = {
      gte: startOfDay,
      lte: endOfDay
    };
  }

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

      <AttendanceListFilters employeeName={employeeName} />

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
              attendances.map((record) => {
                let displayHours = "-";
                if (record.workedHours !== null) {
                  displayHours = record.workedHours.toFixed(2);
                } else if (record.checkIn && record.checkOut) {
                  // Compute dynamically if missing
                  const diff = record.checkOut.getTime() - record.checkIn.getTime();
                  displayHours = (diff / (1000 * 60 * 60)).toFixed(2);
                }

                return (
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
                      {displayHours}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
