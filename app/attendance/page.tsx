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
    <div className="container mx-auto py-10 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Attendance Records</h1>
        {canWrite && (
          <Link href="/attendance/new">
            <Button className="shadow-sm">Add Manual Entry</Button>
          </Link>
        )}
      </div>

      <AttendanceListFilters employeeName={employeeName} />

      <div className="space-y-12">
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
            No attendance records found.
          </div>
        ) : (
          Object.entries(grouped).map(([empName, months]) => (
            <details key={empName} className="group premium-card" open>
              <summary className="text-2xl font-bold tracking-tight flex items-center gap-3 cursor-pointer p-6 bg-card hover:bg-muted/50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
                  {empName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)}
                </span>
                <span className="flex-1 text-foreground">{empName}</span>
                <div className="ml-auto text-muted-foreground transition-transform duration-300 group-open:rotate-180 bg-secondary p-2 rounded-full hover:bg-secondary/80">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </summary>
              
              <div className="space-y-8 p-6 border-t border-border bg-muted/30">
                {Object.entries(months).map(([monthStr, records]) => (
                  <div key={monthStr} className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                      {monthStr}
                    </h3>
                    <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-muted-foreground font-medium">Check In</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Check Out</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Worked Hours</TableHead>
                            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                            <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
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
                              <TableRow key={record.id} className="border-border hover:bg-muted/50">
                                <TableCell className="text-foreground">{format(new Date(record.checkIn), "PPP p")}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {record.checkOut
                                    ? format(new Date(record.checkOut), "PPP p")
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {displayHours}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-secondary border-border text-secondary-foreground">
                                      {record.status}
                                    </Badge>
                                    {record.isManualEntry && (
                                      <Badge variant="default" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none shadow-none">
                                        Manual Correction
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {canWrite && (
                                    <Link href={`/attendance/${record.id}`}>
                                      <Button variant="outline" size="sm" className="bg-background border-border text-foreground hover:bg-muted">
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
