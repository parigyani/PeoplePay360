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
  searchParams: Promise<{ employeeId?: string; search?: string; date?: string; month?: string }>;
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
  } else if (params.month) {
    // params.month is in YYYY-MM format
    const [year, month] = params.month.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    
    whereClause.checkIn = {
      gte: startDate,
      lte: endDate
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

  // Group by Employee -> Month
  type GroupedAttendances = {
    [employeeName: string]: {
      [monthStr: string]: typeof attendances;
    };
  };

  const grouped: GroupedAttendances = {};

  attendances.forEach((record) => {
    const empName = record.employee.name;
    const monthStr = format(new Date(record.checkIn), "MMMM yyyy");
    
    if (!grouped[empName]) grouped[empName] = {};
    if (!grouped[empName][monthStr]) grouped[empName][monthStr] = [];
    
    grouped[empName][monthStr].push(record);
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

      <div className="space-y-12">
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-md border p-12 text-center text-muted-foreground">
            No attendance records found.
          </div>
        ) : (
          Object.entries(grouped).map(([empName, months]) => (
            <details key={empName} className="group bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-hidden" open>
              <summary className="text-2xl font-bold tracking-tight flex items-center gap-2 cursor-pointer p-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm shrink-0">
                  {empName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)}
                </span>
                <span className="flex-1">{empName}</span>
                <div className="ml-auto text-muted-foreground transition-transform duration-200 group-open:rotate-180">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </summary>
              
              <div className="space-y-8 p-6 border-t border-white/[0.05] bg-background/50">
                {Object.entries(months).map(([monthStr, records]) => (
                  <div key={monthStr} className="space-y-3">
                    <h3 className="text-lg font-semibold text-primary/80 border-b border-white/[0.05] pb-2">
                      {monthStr}
                    </h3>
                    <div className="rounded-md border border-white/[0.06] overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/[0.02]">
                          <TableRow className="border-white/[0.06] hover:bg-transparent">
                            <TableHead>Check In</TableHead>
                            <TableHead>Check Out</TableHead>
                            <TableHead>Worked Hours</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((record) => {
                            let displayHours = "-";
                            if (record.workedHours !== null) {
                              displayHours = record.workedHours.toFixed(2);
                            } else if (record.checkIn && record.checkOut) {
                              // Compute dynamically if missing
                              const diff = record.checkOut.getTime() - record.checkIn.getTime();
                              displayHours = (diff / (1000 * 60 * 60)).toFixed(2);
                            }

                            return (
                              <TableRow key={record.id} className="border-white/[0.04] hover:bg-white/[0.02]">
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
                                    <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1]">
                                      {record.status}
                                    </Badge>
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
                                      <Button variant="outline" size="sm" className="bg-white/[0.02] border-white/[0.1] hover:bg-white/[0.05]">
                                        Edit
                                      </Button>
                                    </Link>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
