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
  allocated: z.coerce.number().min(0, "Must be positive"),
  validFrom: z.string().min(1, "Valid From is required"),
  validTo: z.string().optional(),
  description: z.string().optional(),
  approverRole: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  initialData?: any;
  employees: { id: number; name: string }[];
  types: { id: number; name: string }[];
  canApprove: boolean;
}

export function AllocationForm({ initialData, employees, types, canApprove }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acting, setActing] = useState(false);

  // Status and taken/remaining are entirely read-only frontend side
  const isViewMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: initialData?.employeeId?.toString() || "",
      typeId: initialData?.typeId?.toString() || "",
      allocated: initialData?.allocated || 0,
      validFrom: initialData ? format(new Date(initialData.validFrom), "yyyy-MM-dd") : "",
      validTo: initialData?.validTo ? format(new Date(initialData.validTo), "yyyy-MM-dd") : "",
      description: initialData?.description || "",
      approverRole: initialData?.approverRole || "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (isViewMode) return; // Cannot edit an existing allocation via this form once created
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        employeeId: parseInt(data.employeeId, 10),
        typeId: parseInt(data.typeId, 10),
        validFrom: new Date(data.validFrom).toISOString(),
        validTo: data.validTo ? new Date(data.validTo).toISOString() : null,
      };

      const response = await fetch("/api/time-off/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create allocation");
      }

      router.push("/time-off/allocations");
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
      const response = await fetch(`/api/time-off/allocations/${initialData.id}/approve`, {
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
            {initialData ? "Allocation Details" : "New Allocation"}
          </h2>
          {initialData && (
            <p className="text-sm text-muted-foreground mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-white/10 bg-secondary">
            {/* Left Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/[0.03] border-white/[0.08]">
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/[0.03] border-white/[0.08]">
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

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="allocated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocated</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          disabled={isViewMode}
                          className="bg-background/[0.03] border-white/[0.08]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Taken</Label>
                  <Input
                    disabled
                    value={initialData?.taken ?? 0}
                    className="bg-background/[0.03] border-white/[0.08] text-muted-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Remaining</Label>
                  <Input
                    disabled
                    value={initialData?.remaining ?? (isViewMode ? 0 : form.watch("allocated"))}
                    className="bg-background/[0.03] border-white/[0.08] text-muted-foreground font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isViewMode}
                          className="bg-background/[0.03] border-white/[0.08]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isViewMode}
                          className="bg-background/[0.03] border-white/[0.08]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="approverRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approver</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. HR Manager"
                        {...field}
                        disabled={isViewMode}
                        className="bg-background/[0.03] border-white/[0.08]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Validity Label</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. 2026 Annual Balance"
                        {...field}
                        disabled={isViewMode}
                        className="h-20 bg-background/[0.03] border-white/[0.08] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {!isViewMode && (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Creating..." : "Create Allocation"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
