"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmployeeKanban } from "@/components/employees/EmployeeKanban";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, LayoutGrid, List, Search } from "lucide-react";

export interface SerializedEmployee {
  id: number;
  name: string;
  department: string;
  jobPosition: string;
  managerId: number | null;
  scheduleId: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  manager: {
    id: number;
    name: string;
    department: string;
    jobPosition: string;
    managerId: number | null;
    scheduleId: number | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  schedule: {
    id: number;
    name: string;
    type: string;
    weeklyHours: number;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface SerializedSchedule {
  id: number;
  name: string;
  type: string;
  weeklyHours: number;
  createdAt: string;
  updatedAt: string;
}

interface EmployeeClientViewProps {
  employees: SerializedEmployee[];
  schedules: SerializedSchedule[];
  canEdit: boolean;
}

export function EmployeeClientView({
  employees,
  schedules,
  canEdit,
}: EmployeeClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  
  const [activeView, setActiveView] = useState<"kanban" | "list">(
    viewParam === "list" ? "list" : "kanban"
  );
  
  useEffect(() => {
    if (viewParam === "list" || viewParam === "kanban") {
      setActiveView(viewParam);
    }
  }, [viewParam]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.jobPosition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`);
  };

  const subtextMap = {
    kanban: "Default view: Kanban — group employees by department",
    list: "List view for sort, filter and bulk scanning",
  };

  return (
    <div className="space-y-6 container mx-auto max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Employees</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {subtextMap[activeView]}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {canEdit && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            NEW
          </Button>
        )}

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/[0.06] shadow-inner"
          />
        </div>

        <div className="ml-auto flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          <button
            onClick={() => setActiveView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === "kanban"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setActiveView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === "list"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === "kanban" ? (
        <EmployeeKanban
          employees={filteredEmployees}
          onClick={handleCardClick}
        />
      ) : (
        <EmployeeList
          employees={filteredEmployees}
          onClick={handleCardClick}
        />
      )}

      {/* Footer hint */}
      <p className="text-xs text-muted-foreground/60 pt-4 text-center">
        {activeView === "kanban" 
          ? "Useful note: Kanban is good for browsing; clicking a card should open the same Employee Form used everywhere else."
          : "the list view is the main entry point for opening a specific employee record quickly"}
      </p>

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[hsl(224,71%,4%)] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>Create Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            managers={employees}
            schedules={schedules}
            onSuccess={() => {
              setIsDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
