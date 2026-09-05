"use client";

import { useState } from "react";
import { Employee, WorkingSchedule } from "@prisma/client";
import { EmployeeKanban } from "@/components/employees/EmployeeKanban";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

interface EmployeeClientViewProps {
  employees: Employee[];
  schedules: WorkingSchedule[];
  canEdit: boolean;
}

export function EmployeeClientView({
  employees,
  schedules,
  canEdit,
}: EmployeeClientViewProps) {
  const [activeTab, setActiveTab] = useState("kanban");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

  const openCreateDialog = () => {
    setSelectedEmployee(undefined);
    setIsDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedEmployee(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your organization's employees.
          </p>
        </div>
        {canEdit && (
          <Button onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="space-y-4">
          <EmployeeKanban
            employees={employees}
            onEdit={openEditDialog}
            canEdit={canEdit}
          />
        </TabsContent>
        <TabsContent value="list" className="space-y-4">
          <EmployeeList
            employees={employees}
            onEdit={openEditDialog}
            canEdit={canEdit}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Edit Employee" : "Create Employee"}
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={selectedEmployee}
            managers={employees} // passing all employees as potential managers (form will exclude self)
            schedules={schedules}
            onSuccess={closeDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
