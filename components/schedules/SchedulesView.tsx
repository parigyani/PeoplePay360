"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScheduleForm } from "./ScheduleForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface SchedulesViewProps {
  schedules: any[];
  canWrite: boolean;
  isAdmin?: boolean;
}

export function SchedulesView({ schedules, canWrite, isAdmin }: SchedulesViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);

  const selectedSchedule = selectedId === "new" ? undefined : schedules.find(s => s.id === selectedId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      {/* Left Pane: List */}
      <div className="w-full md:w-1/3 flex flex-col border border-white/[0.08] rounded-xl overflow-hidden glass-card">
        <div className="p-4 border-b border-white/[0.08] flex justify-between items-center bg-background/[0.02]">
          <h2 className="font-semibold">Schedules</h2>
          {canWrite && (
            <Button size="sm" onClick={() => setSelectedId("new")}>
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {schedules.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">No schedules found.</div>
          ) : (
            schedules.map((sch) => (
              <div 
                key={sch.id}
                onClick={() => setSelectedId(sch.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  selectedId === sch.id 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-background/[0.02] border-white/[0.04] hover:bg-background/[0.04]"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-foreground">{sch.name}</span>
                  <Badge variant="secondary" className="text-[10px] bg-background/[0.06]">{sch.type}</Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-xs text-muted-foreground">
                    {sch.weeklyHours}h/week • {sch._count?.employees || 0} employees
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`status-dot ${sch.isActive ? "status-dot-active" : "status-dot-inactive"}`} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Form */}
      <div className="w-full md:w-2/3 flex flex-col border border-white/[0.08] rounded-xl overflow-y-auto glass-card">
        {selectedId ? (
          <div className="p-6">
            <ScheduleForm 
              key={selectedId === "new" ? "new" : selectedId}
              initialData={selectedSchedule} 
              onSuccess={() => {
                setSelectedId(null);
                router.refresh();
              }} 
            />
            {isAdmin && selectedSchedule && selectedSchedule.employees && (
              <div className="mt-8 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Assigned Employees</h3>
                  <Badge variant="secondary">{selectedSchedule.employees.length} employees</Badge>
                </div>
                {selectedSchedule.employees.length === 0 ? (
                  <div className="p-8 text-center border border-white/[0.05] rounded-xl text-muted-foreground bg-background/[0.01]">
                    No employees are currently assigned to this working schedule.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSchedule.employees.map((emp: any) => (
                      <div key={emp.id} className="p-4 rounded-xl border border-white/[0.05] bg-background/[0.02] flex items-center justify-between">
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.jobPosition} • {emp.department}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/employees/${emp.id}`)}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="m-auto text-muted-foreground text-sm flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-background/[0.02] flex items-center justify-center">
              <Plus className="w-8 h-8 opacity-20" />
            </div>
            Select a schedule from the list to view or edit
          </div>
        )}
      </div>
    </div>
  );
}
