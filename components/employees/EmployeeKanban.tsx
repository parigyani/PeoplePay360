"use client";

import type { SerializedEmployee } from "@/app/employees/EmployeeClientView";
import { Badge } from "@/components/ui/badge";

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

interface EmployeeKanbanProps {
  employees: SerializedEmployee[];
  onClick: (id: number) => void;
}

export function EmployeeKanban({ employees, onClick }: EmployeeKanbanProps) {
  // Group by department
  const departments = employees.reduce((acc, employee) => {
    const dept = employee.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(employee);
    return acc;
  }, {} as Record<string, SerializedEmployee[]>);

  if (Object.keys(departments).length === 0) {
    return (
      <div className="text-center text-muted-foreground w-full py-16 border border-dashed border-border rounded-xl">
        No employees found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Object.entries(departments).map(([dept, deptEmployees]) => (
        <div key={dept} className="space-y-3">
          {/* Department header */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-foreground">{dept}</h3>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80">
              {deptEmployees.length}
            </Badge>
          </div>

          {/* Cards */}
          <div className="space-y-2.5">
            {deptEmployees.map((employee) => (
              <div
                key={employee.id}
                className="kanban-card premium-card p-5 cursor-pointer"
                onClick={() => onClick(employee.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className={`h-11 w-11 flex items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarColor(employee.name)} text-white font-bold text-sm shrink-0 shadow-sm`}
                  >
                    {getInitials(employee.name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {employee.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {employee.jobPosition}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 truncate mt-1">
                      {employee.department}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className={`status-dot ${
                          employee.status === "Active"
                            ? "status-dot-active"
                            : "status-dot-inactive"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          employee.status === "Active"
                            ? "text-status-active"
                            : "text-status-inactive"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
