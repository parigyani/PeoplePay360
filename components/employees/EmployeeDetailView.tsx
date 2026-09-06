// @ts-nocheck
"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Save, X, CalendarClock, FileText, CheckCircle2 } from "lucide-react";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
];

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  jobPosition: z.string().min(1, "Job position is required"),
  managerId: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  phone: z.string().optional(),
  workLocation: z.string().optional(),
  company: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

export function EmployeeDetailView({
  employee,
  allEmployees,
  allSchedules,
  counts,
  canEdit
}: any) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee.name,
      department: employee.department,
      jobPosition: employee.jobPosition,
      managerId: employee.managerId?.toString() || "none",
      scheduleId: employee.scheduleId?.toString() || "none",
      status: employee.status,
      phone: employee.phone || "",
      workLocation: employee.workLocation || "",
      company: employee.company || "Acme Corp",
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        managerId: data.managerId === "none" ? null : parseInt(data.managerId!, 10),
        scheduleId: data.scheduleId === "none" ? null : parseInt(data.scheduleId!, 10),
      };

      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");

      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert("Error updating employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const workEmail = employee.name.toLowerCase().replace(/\s+/g, ".") + "@company.com";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex items-start justify-between">
        <div className="flex gap-6 items-center">
          <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg bg-gradient-to-br ${getAvatarColor(employee.name)}`}>
            {getInitials(employee.name)}
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wider text-primary mb-1 uppercase">Employee / {employee.name}</div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{employee.name}</h1>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              {employee.jobPosition} <span className="text-white/20">•</span> {employee.department}
            </p>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              {workEmail} <span className="text-white/20">|</span> {employee.phone || "No phone provided"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {canEdit && (
            <Button 
              variant={isEditing ? "outline" : "default"} 
              className={isEditing ? "bg-white/[0.03] hover:bg-white/[0.08]" : "bg-primary hover:bg-primary/90"}
              onClick={() => {
                if (isEditing) form.reset();
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? <><X className="w-4 h-4 mr-2"/> Cancel Edit</> : <><Edit2 className="w-4 h-4 mr-2"/> EDIT</>}
            </Button>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Link href={`/time-off?employeeId=${employee.id}`} className="smart-button">
              <CalendarClock className="w-3.5 h-3.5" /> Time Off {counts.timeOff}
            </Link>
            <Link href={`/contracts?employeeId=${employee.id}`} className="smart-button">
              <FileText className="w-3.5 h-3.5" /> Contracts {counts.contracts}
            </Link>
            <Link href={`/attendance?employeeId=${employee.id}`} className="smart-button">
              <CheckCircle2 className="w-3.5 h-3.5" /> Attendance {counts.attendance}
            </Link>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline">Edit Employee</Button>
        )}
      </div>

      {/* Main Content */}
      <div className="glass-card rounded-2xl p-6 shadow-xl overflow-hidden">
        <Tabs defaultValue="work" className="w-full">
          <TabsList className="bg-white/[0.03] border-white/[0.08] mb-8">
            <TabsTrigger value="work" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Work Information</TabsTrigger>
            <TabsTrigger value="private">Private Information</TabsTrigger>
          </TabsList>

          <TabsContent value="work">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Department</FormLabel>
                          {isEditing ? (
                            <FormControl>
                              <Input {...field} className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary" />
                            </FormControl>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">{field.value}</div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="managerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Manager</FormLabel>
                          {isEditing ? (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                                  <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {allEmployees.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                              {employee.manager ? employee.manager.name : "None"}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduleId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Working Schedule</FormLabel>
                          {isEditing ? (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                                  <SelectValue placeholder="Select schedule" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {allSchedules.map((sch: any) => (
                                  <SelectItem key={sch.id} value={sch.id.toString()}>
                                    {sch.name} ({sch.weeklyHours}h / Week)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                              {employee.schedule ? `${employee.schedule.name} (${employee.schedule.weeklyHours}h / Week)` : "None"}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Company</FormLabel>
                          {isEditing ? (
                            <FormControl>
                              <Input {...field} className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary" />
                            </FormControl>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                              {field.value || "Not provided"}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="jobPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Job Position</FormLabel>
                          {isEditing ? (
                            <FormControl>
                              <Input {...field} className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary" />
                            </FormControl>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">{field.value}</div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Work Location</FormLabel>
                          {isEditing ? (
                            <FormControl>
                              <Input {...field} className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary" />
                            </FormControl>
                          ) : (
                            <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                              {field.value || "Not provided"}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground/80">Status</FormLabel>
                          {isEditing ? (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="font-medium pb-2 border-b border-white/[0.06] flex items-center gap-2">
                              <div className={`status-dot ${field.value === 'Active' ? 'status-dot-active' : 'status-dot-inactive'}`} />
                              <span className={field.value === 'Active' ? 'text-status-active' : 'text-status-inactive'}>{field.value}</span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium leading-none text-muted-foreground/80">Work Email</label>
                      <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                        {workEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-6 flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-32">
                      {isSubmitting ? "Saving..." : <><Save className="w-4 h-4 mr-2"/> Save</>}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="private">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground/80">Personal Email</label>
                  <div className="font-medium text-foreground/40 pb-2 border-b border-white/[0.04] italic">Not provided</div>
                </div>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Phone</FormLabel>
                      {isEditing ? (
                        <FormControl>
                          <Input {...field} className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary" />
                        </FormControl>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.04]">
                          {field.value || <span className="italic text-foreground/40">Not provided</span>}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground/80">Address</label>
                  <div className="font-medium text-foreground/40 pb-2 border-b border-white/[0.04] italic">Not provided</div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground/80">Emergency Contact</label>
                  <div className="font-medium text-foreground/40 pb-2 border-b border-white/[0.04] italic">Not provided</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none text-muted-foreground/80">IBAN / Bank Details</label>
                  <div className="font-medium text-foreground/40 pb-2 border-b border-white/[0.04] italic">Not provided</div>
                </div>
              </div>
            </div>
            <p className="mt-8 text-xs text-muted-foreground/50 text-center">
              Private information fields are currently UI-only placeholders.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
