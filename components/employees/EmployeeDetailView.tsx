"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmployeeDetailView({
  employee,
  allEmployees,
  allSchedules,
  counts,
  canEdit
}: {
  employee: any;
  allEmployees: any[];
  allSchedules: any[];
  counts: { contracts: number; timeOff: number; attendance: number };
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        {canEdit && (
          <Link href={`/employees/${employee.id}/edit`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium border border-gray-300">
            Edit Employee
          </Link>
        )}
      </div>

      <div className="flex space-x-4 mb-6">
        <Link href={`/contracts?employeeId=${employee.id}`} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm border border-gray-300 text-sm font-medium">
          Contracts ({counts.contracts})
        </Link>
        <Link href={`/time-off/requests?employeeId=${employee.id}`} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm border border-gray-300 text-sm font-medium">
          Time Off ({counts.timeOff})
        </Link>
        <Link href={`/attendance?employeeId=${employee.id}`} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md shadow-sm border border-gray-300 text-sm font-medium">
          Attendance ({counts.attendance})
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Work Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.department || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.jobPosition || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.manager?.name || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Schedule</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.schedule?.name || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.status || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Work Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.workEmail || "N/A"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
