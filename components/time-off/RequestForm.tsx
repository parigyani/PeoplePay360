"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  typeId: z.string().min(1, "Time Off Type is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  duration: z.coerce.number().min(0, "Must be positive"),
  approverRole: z.string().optional(),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  initialData?: any;
  employees: { id: number; name: string }[];
  types: { id: number; name: string }[];
  canApprove: boolean;
}

export function RequestForm({ initialData, employees, types, canApprove }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acting, setActing] = useState(false);

  const isViewMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: initialData?.employeeId?.toString() || "",
      typeId: initialData?.typeId?.toString() || "",
      startDate: initialData ? format(new Date(initialData.startDate), "yyyy-MM-dd") : "",
      endDate: initialData ? format(new Date(initialData.endDate), "yyyy-MM-dd") : "",
      duration: initialData?.duration || 0,
      approverRole: initialData?.approverRole || "",
      reason: initialData?.reason || "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (isViewMode) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        employeeId: parseInt(data.employeeId, 10),
        typeId: parseInt(data.typeId, 10),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      const response = await fetch("/api/time-off/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create request");
      }

      router.push("/time-off/requests");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(action: "approve" | "refuse") {
    if (!initialData) return;
    setActing(true);
    try {
      const response = await fetch(`/api/time-off/requests/${initialData.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {initialData ? "Time Off Request Details" : "New Time Off Request"}
          </h2>
          {initialData && (
            <p className="text-sm text-slate-400 mt-1">
              Status: <span className={initialData.status === "Approved" ? "text-green-400 font-medium" : initialData.status === "Refused" ? "text-red-400 font-medium" : "text-orange-400 font-medium"}>{initialData.status}</span>
            </p>
          )}
        </div>
        
        {initialData && canApprove && initialData.status === "To Approve" && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => handleAction("refuse")}
              disabled={acting}
            >
              Refuse
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleAction("approve")}
              disabled={acting}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-white/10 bg-black/20">
            {/* Left Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                      <FormControl>
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Off Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                      <FormControl>
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isViewMode} className="bg-white/[0.03] border-white/[0.08]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isViewMode} className="bg-white/[0.03] border-white/[0.08]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} disabled={isViewMode} className="bg-white/[0.03] border-white/[0.08]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Status</Label>
                <Input disabled value={initialData?.status || "To Approve"} className="bg-white/[0.03] border-white/[0.08] text-slate-400" />
              </div>

              <FormField
                control={form.control}
                name="approverRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approver</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HR Manager" {...field} disabled={isViewMode} className="bg-white/[0.03] border-white/[0.08]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Allocation Used</Label>
                <Input 
                  disabled 
                  value={initialData?.allocation ? `Allocation #${initialData.allocation.id} (${initialData.allocation.description || 'No label'})` : (initialData?.status === "Approved" ? "None (Not required)" : "Pending Approval")} 
                  className="bg-white/[0.03] border-white/[0.08] text-slate-400" 
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-black/20">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional reason for request..."
                      {...field}
                      disabled={isViewMode}
                      className="h-24 bg-white/[0.03] border-white/[0.08] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {!isViewMode && (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
