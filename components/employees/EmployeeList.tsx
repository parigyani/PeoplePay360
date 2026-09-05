"use client";

import type { SerializedEmployee } from "@/app/employees/EmployeeClientView";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface EmployeeListProps {
  employees: SerializedEmployee[];
  onClick: (id: number) => void;
}

export function EmployeeList({ employees, onClick }: EmployeeListProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/[0.06] hover:bg-transparent">
            <TableHead className="text-muted-foreground/70">Employee</TableHead>
            <TableHead className="text-muted-foreground/70">Work Email</TableHead>
            <TableHead className="text-muted-foreground/70">Job Position</TableHead>
            <TableHead className="text-muted-foreground/70">Department</TableHead>
            <TableHead className="text-muted-foreground/70">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No employees found.
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => (
              <TableRow
                key={employee.id}
                className="cursor-pointer border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                onClick={() => onClick(employee.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className={`avatar-initials h-8 w-8 text-[10px] bg-gradient-to-br ${getAvatarColor(
                        employee.name
                      )} shrink-0`}
                    >
                      {getInitials(employee.name)}
                    </div>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.name.toLowerCase().replace(/\s+/g, ".") +
                    "@company.com"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.jobPosition}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.department}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`status-dot ${
                        employee.status === "Active"
                          ? "status-dot-active"
                          : "status-dot-inactive"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        employee.status === "Active"
                          ? "text-status-active"
                          : "text-status-inactive"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
