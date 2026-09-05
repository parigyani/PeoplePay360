"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Edit2, Save, X, CheckCircle2, XCircle } from "lucide-react";

const requestSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  typeId: z.string().min(1, "Time Off Type is required"),
  startDate: z.date({ required_error: "Start Date is required" }),
  endDate: z.date({ required_error: "End Date is required" }),
  duration: z.coerce.number().positive("Duration must be positive"),
  reason: z.string().optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End Date cannot be earlier than Start Date",
    path: ["endDate"],
  }
);

export type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestFormProps {
  initialData?: RequestFormValues & { id?: number; status?: string };
  employees: { id: number; name: string }[];
  types: { id: number; name: string; unit: string; requiresAllocation?: boolean }[];
  employeeName?: string;
  approverName?: string | null;
  allocationDesc?: string;
  canApprove?: boolean;
}

export function RequestForm({ 
  initialData, 
  employees, 
  types,
  employeeName,
  approverName,
  allocationDesc,
  canApprove
}: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialData);

  const isReadOnly = initialData?.status === "APPROVED" || initialData?.status === "REFUSED";

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: initialData || {
      employeeId: "",
      typeId: "",
      startDate: undefined,
      endDate: undefined,
      duration: 0,
      reason: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // Simple auto-compute duration if not set
  useEffect(() => {
    if (startDate && endDate && endDate >= startDate && !initialData) {
      // Rough compute: diff in days + 1, skipping weekends for simplicity
      let count = 0;
      let current = new Date(startDate);
      while (current <= endDate) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      form.setValue("duration", count);
    }
  }, [startDate, endDate, form, initialData]);

  async function onSubmit(data: RequestFormValues) {
    if (isReadOnly && initialData) return;
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/time-off/requests/${initialData.id}`
        : "/api/time-off/requests";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save request");
      }

      setIsEditing(false);
      router.push("/time-off/requests");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save request");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'approve' | 'refuse') {
    if (!initialData?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/time-off/requests/${initialData.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to ${action} request`);
      }
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || `Error trying to ${action} request`);
    } finally {
      setLoading(false);
    }
  }

  const status = initialData?.status || "PENDING";
  const isPending = status === "PENDING";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wider text-primary mb-1 uppercase">
            Form view of one time off request
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Time Off Request / {employeeName || "New"}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-3">
          {initialData && isPending && canApprove && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                onClick={() => handleAction('approve')}
                disabled={loading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button
                variant="outline"
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                onClick={() => handleAction('refuse')}
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-2" /> Refuse
              </Button>
            </div>
          )}

          {initialData && !isReadOnly && (
            <Button
              variant={isEditing ? "outline" : "default"}
              className={
                isEditing
                  ? "bg-white/[0.03] hover:bg-white/[0.08]"
                  : "bg-primary hover:bg-primary/90 mt-2"
              }
              onClick={() => {
                if (isEditing) form.reset();
                setIsEditing(!isEditing);
              }}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" /> Cancel Edit
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" /> EDIT
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-xl overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              {/* Left Column */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Employee</FormLabel>
                      {isEditing && !initialData ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id.toString()}>
                                {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {employeeName || employees.find(e => e.id.toString() === field.value)?.name || "—"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="typeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Time Off Type</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {types.map((t) => (
                              <SelectItem key={t.id} value={t.id.toString()}>
                                {t.name} ({t.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {types.find(t => t.id.toString() === field.value)?.name || "—"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-muted-foreground/80">Start Date</FormLabel>
                      {isEditing ? (
                        <DatePicker date={field.value} setDate={field.onChange} />
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value ? field.value.toLocaleDateString() : "—"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-muted-foreground/80">End Date</FormLabel>
                      {isEditing ? (
                        <DatePicker date={field.value} setDate={field.onChange} />
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value ? field.value.toLocaleDateString() : "—"}
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
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Duration (auto-computed)</FormLabel>
                      {isEditing ? (
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            className="bg-white/[0.03] border-white/[0.1] focus-visible:ring-primary"
                          />
                        </FormControl>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Status</FormLabel>
                  <div className="font-medium text-foreground pb-2 border-b border-white/[0.06] flex items-center gap-2">
                    {status === "APPROVED" && (
                      <><div className="status-dot status-dot-active" /><span className="text-status-active">Approved</span></>
                    )}
                    {status === "PENDING" && (
                      <><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /><span className="text-amber-500">To Approve</span></>
                    )}
                    {status === "REFUSED" && (
                      <><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /><span className="text-red-500">Refused</span></>
                    )}
                  </div>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Approver</FormLabel>
                  <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                    {approverName || "—"}
                  </div>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Allocation Used</FormLabel>
                  <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                    {allocationDesc || "—"}
                  </div>
                </FormItem>
              </div>
            </div>

            {/* Below Grid */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="mt-8">
                  <FormLabel className="text-muted-foreground/80">Reason</FormLabel>
                  {isEditing ? (
                    <FormControl>
                      <textarea
                        {...field}
                        value={field.value || ""}
                        className="w-full min-h-[100px] p-3 rounded-md bg-white/[0.03] border border-white/[0.1] focus-visible:ring-1 focus-visible:ring-primary text-sm outline-none"
                        placeholder="E.g. Doctor appointment."
                      />
                    </FormControl>
                  ) : (
                    <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.05] min-h-[100px] text-foreground/80 text-sm whitespace-pre-wrap">
                      {field.value || <span className="italic opacity-50">No reason provided</span>}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <div className="pt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-32"
                >
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mt-4">
          Useful note: duration is deducted from employee&apos;s allocation only after approval.
        </p>
      </div>
    </div>
  );
}
