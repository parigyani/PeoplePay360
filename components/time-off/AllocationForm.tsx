"use client";

import { useState } from "react";
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

const allocationSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  typeId: z.string().min(1, "Time Off Type is required"),
  allocated: z.coerce.number().min(0, "Allocated must be positive"),
  validFrom: z.date({ required_error: "Valid From date is required" }),
  validTo: z.date().optional().nullable(),
  description: z.string().optional().nullable(),
}).refine(
  (data) => !data.validTo || data.validTo >= data.validFrom,
  {
    message: "Valid To cannot be earlier than Valid From",
    path: ["validTo"],
  }
);

export type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocationFormProps {
  initialData?: AllocationFormValues & { 
    id?: number; 
    taken?: number; 
    remaining?: number;
    status?: string;
  };
  employees: { id: number; name: string }[];
  types: { id: number; name: string }[];
  employeeName?: string;
  approverName?: string | null;
  canApprove?: boolean;
}

export function AllocationForm({ 
  initialData, 
  employees, 
  types, 
  employeeName,
  approverName,
  canApprove 
}: AllocationFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!initialData);
  const [loading, setLoading] = useState(false);

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: initialData || {
      employeeId: "",
      typeId: "",
      allocated: 0,
      validFrom: undefined,
      validTo: null,
      description: "",
    },
  });

  async function onSubmit(data: AllocationFormValues) {
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/time-off/allocations/${initialData.id}`
        : "/api/time-off/allocations";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save allocation");
      }

      setIsEditing(false);
      router.push("/time-off/allocations");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save allocation");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'approve' | 'refuse') {
    if (!initialData?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/time-off/allocations/${initialData.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Failed to ${action} allocation`);
      }
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(`Error trying to ${action} allocation`);
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
            Form view of one allocation record
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Allocation / {employeeName || "New"}
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

          {initialData && (
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
                                {t.name}
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
                  name="allocated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Allocated Amount</FormLabel>
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
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Taken</FormLabel>
                  <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                    {initialData?.taken ?? 0}
                  </div>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Remaining</FormLabel>
                  <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                    {initialData?.remaining ?? 0}
                  </div>
                </FormItem>

                <FormItem>
                  <FormLabel className="text-muted-foreground/80">Approver</FormLabel>
                  <div className="font-medium text-foreground/60 pb-2 border-b border-white/[0.06]">
                    {approverName || "—"}
                  </div>
                </FormItem>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="validFrom"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-muted-foreground/80">Valid From</FormLabel>
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
                    name="validTo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-muted-foreground/80">Valid To</FormLabel>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <DatePicker
                              date={field.value || undefined}
                              setDate={field.onChange}
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => field.onChange(null)}
                                className="px-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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
              </div>
            </div>

            {/* Below Grid */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mt-8">
                  <FormLabel className="text-muted-foreground/80">Description</FormLabel>
                  {isEditing ? (
                    <FormControl>
                      <textarea
                        {...field}
                        value={field.value || ""}
                        className="w-full min-h-[100px] p-3 rounded-md bg-white/[0.03] border border-white/[0.1] focus-visible:ring-1 focus-visible:ring-primary text-sm outline-none"
                        placeholder="E.g. Annual leave balance granted at start of policy year."
                      />
                    </FormControl>
                  ) : (
                    <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.05] min-h-[100px] text-foreground/80 text-sm whitespace-pre-wrap">
                      {field.value || <span className="italic opacity-50">No description provided</span>}
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
          Useful note: approved allocation is what creates available leave balance for the employee.
        </p>
      </div>
    </div>
  );
}
