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
import { Switch } from "@/components/ui/switch";
import { Edit2, Save, X } from "lucide-react";

const typeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresAllocation: z.boolean(),
  payrollIntegrated: z.boolean(),
  approverRole: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export type TimeOffTypeFormValues = z.infer<typeof typeSchema>;

interface TimeOffTypeFormProps {
  initialData?: TimeOffTypeFormValues & { id?: number };
}

export function TimeOffTypeForm({ initialData }: TimeOffTypeFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(!initialData);
  const [loading, setLoading] = useState(false);

  const form = useForm<TimeOffTypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: initialData || {
      name: "",
      unit: "DAYS",
      requiresAllocation: true,
      payrollIntegrated: false,
      approverRole: "Manager",
      color: "Blue",
      isActive: true,
      notes: "",
    },
  });

  async function onSubmit(data: TimeOffTypeFormValues) {
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/time-off/types/${initialData.id}`
        : "/api/time-off/types";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save time off type");
      }

      setIsEditing(false);
      router.push("/time-off/types");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save time off type");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wider text-primary mb-1 uppercase">
            Form view of one time off type
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Time Off Type / {initialData ? initialData.name : "New"}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-3">
          {initialData && (
            <Button
              variant={isEditing ? "outline" : "default"}
              className={
                isEditing
                  ? "bg-white/[0.03] hover:bg-white/[0.08]"
                  : "bg-primary hover:bg-primary/90"
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Type Name</FormLabel>
                      {isEditing ? (
                        <FormControl>
                          <Input
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

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Unit</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DAYS">Days</SelectItem>
                            <SelectItem value="HOURS">Hours</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value === "DAYS" ? "Days" : "Hours"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresAllocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Requires Allocation</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={(val) => field.onChange(val === "true")}
                          defaultValue={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value ? "Yes" : "No"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Active</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={(val) => field.onChange(val === "true")}
                          defaultValue={field.value !== false ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value !== false ? "True" : "False"}
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
                  name="approverRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Approval</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "Manager"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select approver role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="Officer">Officer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value || "Manager"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payrollIntegrated"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Payroll / Work Entry</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={(val) => field.onChange(val === "true")}
                          defaultValue={field.value ? "true" : "false"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Leave Work Entry</SelectItem>
                            <SelectItem value="false">No Integration</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06]">
                          {field.value ? "Leave Work Entry" : "No Integration"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground/80">Display Color</FormLabel>
                      {isEditing ? (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || "Blue"}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/[0.03] border-white/[0.1]">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="Green">Green</SelectItem>
                            <SelectItem value="Purple">Purple</SelectItem>
                            <SelectItem value="Orange">Orange</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                            <SelectItem value="Indigo">Indigo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-foreground pb-2 border-b border-white/[0.06] flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${(field.value || 'Blue').toLowerCase()}-500`} />
                          {field.value || "Blue"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Below Grid */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="mt-8">
                  <FormLabel className="text-muted-foreground/80">Configuration Notes</FormLabel>
                  {isEditing ? (
                    <FormControl>
                      <textarea
                        {...field}
                        value={field.value || ""}
                        className="w-full min-h-[100px] p-3 rounded-md bg-white/[0.03] border border-white/[0.1] focus-visible:ring-1 focus-visible:ring-primary text-sm outline-none"
                        placeholder="E.g. Standard annual leave. Balance comes from approved allocations."
                      />
                    </FormControl>
                  ) : (
                    <div className="p-4 rounded-md bg-white/[0.02] border border-white/[0.05] min-h-[100px] text-foreground/80 text-sm whitespace-pre-wrap">
                      {field.value || <span className="italic opacity-50">No notes provided</span>}
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
          Useful note: Time Off Type drives approval behavior and whether a request needs an allocation.
        </p>
      </div>
    </div>
  );
}
