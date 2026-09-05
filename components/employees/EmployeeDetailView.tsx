"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export function EmployeeDetailView({
  employee,
  allEmployees,
  allSchedules,
  counts,
  canEdit,
}: {
  employee: any;
  allEmployees: any[];
  allSchedules: any[];
  counts: { contracts: number; timeOff: number; attendance: number };
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
          <p className="text-muted-foreground">
            {employee.jobPosition} - {employee.department}
          </p>
        </div>
        {canEdit && (
          <Button variant="outline">Edit Employee</Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Col - Info */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground block">Status</span>
                <Badge variant={employee.status === "Active" ? "default" : "secondary"}>
                  {employee.status}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Manager</span>
                <span className="font-medium">
                  {employee.manager ? employee.manager.name : "None"}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Schedule</span>
                <span className="font-medium">
                  {employee.schedule ? employee.schedule.name : "None"}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block">Hired</span>
                <span className="font-medium">
                  {format(new Date(employee.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Col - Smart Buttons */}
        <div className="space-y-4">
          <Link href={`/contracts?employeeId=${employee.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold">{counts.contracts}</span>
                <span className="text-sm text-muted-foreground">Contracts</span>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/attendance?employeeId=${employee.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold">{counts.attendance}</span>
                <span className="text-sm text-muted-foreground">Attendance</span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/time-off/requests?employeeId=${employee.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold">{counts.timeOff}</span>
                <span className="text-sm text-muted-foreground">Time Off</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
