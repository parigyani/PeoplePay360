"use client";

import { Employee } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmployeeKanbanProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  canEdit: boolean;
}

export function EmployeeKanban({ employees, onEdit, canEdit }: EmployeeKanbanProps) {
  // Group by department
  const departments = employees.reduce((acc, employee) => {
    const dept = employee.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(employee);
    return acc;
  }, {} as Record<string, Employee[]>);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {Object.entries(departments).map(([dept, deptEmployees]) => (
        <div key={dept} className="flex flex-col gap-4 min-w-[300px]">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-semibold text-lg">{dept}</h3>
            <Badge variant="secondary">{deptEmployees.length}</Badge>
          </div>
          
          <div className="flex flex-col gap-3">
            {deptEmployees.map((employee) => (
              <Card 
                key={employee.id} 
                className={`cursor-pointer hover:border-primary transition-colors ${!canEdit && "cursor-default hover:border-border"}`}
                onClick={() => canEdit && onEdit(employee)}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-md">{employee.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground flex flex-col gap-2">
                  <div>{employee.jobPosition}</div>
                  <div>
                    <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {Object.keys(departments).length === 0 && (
        <div className="text-center text-muted-foreground w-full p-8 border rounded-lg border-dashed">
          No employees found.
        </div>
      )}
    </div>
  );
}
