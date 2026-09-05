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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TimeOffType } from "@prisma/client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresAllocation: z.boolean(),
  active: z.boolean(),
  approverRole: z.string().optional().nullable(),
  payrollCode: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  payrollIntegrated: z.boolean(), // hidden but required by schema
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  initialData?: TimeOffType | null;
  onSuccess?: () => void;
  isViewMode?: boolean;
}

export function TimeOffTypeForm({ initialData, onSuccess, isViewMode = false }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditable, setIsEditable] = useState(!isViewMode);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      unit: initialData?.unit || "DAYS",
      requiresAllocation: initialData?.requiresAllocation ?? true,
      active: initialData?.active ?? true,
      approverRole: initialData?.approverRole || "",
      payrollCode: initialData?.payrollCode || "",
      color: initialData?.color || "#3b82f6",
      notes: initialData?.notes || "",
      payrollIntegrated: initialData?.payrollIntegrated ?? false,
    },
  });

  async function onSubmit(data: FormValues) {
    if (!isEditable) return;
    setIsSubmitting(true);
    try {
      const url = initialData
        ? `/api/time-off/types/${initialData.id}`
        : `/api/time-off/types`;
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save type");
      }

      router.refresh();
      if (onSuccess) onSuccess();
      else router.push("/time-off/types");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {initialData ? "Time Off Type Details" : "New Time Off Type"}
        </h2>
        {isViewMode && (
          <Button
            variant="outline"
            onClick={() => setIsEditable(!isEditable)}
            className="border-white/10"
          >
            {isEditable ? "Cancel Edit" : "EDIT"}
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-white/10 bg-black/20">
            {/* Left Column */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Annual Leave"
                        {...field}
                        disabled={!isEditable}
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!isEditable}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAYS">Days</SelectItem>
                        <SelectItem value="HOURS">Hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approverRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approval</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={!isEditable}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Who approves this?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Officer">Officer</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payrollCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payroll / Work Entry</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. AL-01"
                        {...field}
                        value={field.value || ""}
                        disabled={!isEditable}
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex gap-6">
                <FormField
                  control={form.control}
                  name="requiresAllocation"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 rounded-lg border border-white/10 p-4 w-full bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Requires Allocation</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditable}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 rounded-lg border border-white/10 p-4 w-full bg-white/[0.02]">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Active</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isEditable}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Color</FormLabel>
                    <div className="flex items-center gap-3">
                      <FormControl>
                        <Input
                          type="color"
                          {...field}
                          value={field.value || "#3b82f6"}
                          disabled={!isEditable}
                          className="h-10 w-20 p-1 bg-white/[0.03] border-white/[0.08]"
                        />
                      </FormControl>
                      <span className="text-sm text-slate-400 font-mono uppercase">{field.value}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes about this leave type..."
                        {...field}
                        value={field.value || ""}
                        disabled={!isEditable}
                        className="h-24 bg-white/[0.03] border-white/[0.08] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {isEditable && (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Saving..." : "Save Time Off Type"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
