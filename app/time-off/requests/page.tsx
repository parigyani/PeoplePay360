import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
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
import { RequestActions } from "@/components/time-off/RequestActions";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canApprove = can(role, "timeoff:approve");

  // In a real app, EMPLOYEE role might only see their own requests.
  // For simplicity, we just fetch all or filter similarly to Attendance if needed.
  let targetEmployeeId: number | undefined = undefined;
  if (role === "EMPLOYEE") {
    targetEmployeeId = (session.user as any).employeeId;
  }

  const whereClause = targetEmployeeId ? { employeeId: targetEmployeeId } : {};

  const requests = await prisma.timeOffRequest.findMany({
    where: whereClause,
    include: {
      employee: true,
      type: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
        <Link href="/time-off/requests/new">
          <Button>Create Request</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employee.name}</TableCell>
                  <TableCell>{req.type.name}</TableCell>
                  <TableCell>{format(new Date(req.startDate), "PPP")}</TableCell>
                  <TableCell>{format(new Date(req.endDate), "PPP")}</TableCell>
                  <TableCell>{req.duration} {req.type.unit}</TableCell>
                  <TableCell>
                    {req.status === "PENDING" && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">PENDING</Badge>}
                    {req.status === "APPROVED" && <Badge variant="default" className="bg-green-600 hover:bg-green-700">APPROVED</Badge>}
                    {req.status === "REFUSED" && <Badge variant="destructive">REFUSED</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end items-center">
                      {req.status === "PENDING" && (
                        <Link href={`/time-off/requests/${req.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      )}
                      
                      {canApprove && req.status === "PENDING" && (
                        <RequestActions requestId={req.id} />
                      )}
                    </div>
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
