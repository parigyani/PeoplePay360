"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Employee, WorkingSchedule } from "@prisma/client";
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
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  jobPosition: z.string().min(1, "Job position is required"),
  managerId: z.string().optional(),
  scheduleId: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type EmployeeFormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  managers: Employee[];
  schedules: WorkingSchedule[];
  onSuccess: () => void;
}

export function EmployeeForm({ employee, managers, schedules, onSuccess }: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: employee?.name || "",
      department: employee?.department || "",
      jobPosition: employee?.jobPosition || "",
      managerId: employee?.managerId?.toString() || "",
      scheduleId: employee?.scheduleId?.toString() || "",
      status: employee?.status || "ACTIVE",
    },
  });

  async function onSubmit(data: EmployeeFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        managerId: data.managerId ? parseInt(data.managerId, 10) : null,
        scheduleId: data.scheduleId ? parseInt(data.scheduleId, 10) : null,
      };

      const url = employee ? `/api/employees/${employee.id}` : "/api/employees";
      const method = employee ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save employee");
      }

      router.refresh();
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Exclude self from managers list
  const availableManagers = managers.filter(m => m.id !== employee?.id);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Engineering" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Working Schedule</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={schedules.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={schedules.length === 0 ? "No schedules available" : "Select a schedule"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Employee"}
          </Button>
        </form>
      </Form>

      {employee && (
        <div className="pt-4 border-t flex flex-wrap gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href={`/contracts?employeeId=${employee.id}`}>Contracts</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href={`/attendance?employeeId=${employee.id}`}>Attendance</Link>
          </Button>
          <Button variant="outline" asChild size="sm">
            <Link href={`/time-off/requests?employeeId=${employee.id}`}>Time Off Requests</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
