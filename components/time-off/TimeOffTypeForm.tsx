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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresAllocation: z.boolean(),
  payrollIntegrated: z.boolean(),
});

export type TimeOffTypeFormValues = z.infer<typeof typeSchema>;

interface TimeOffTypeFormProps {
  initialData?: TimeOffTypeFormValues & { id?: number };
}

export function TimeOffTypeForm({ initialData }: TimeOffTypeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<TimeOffTypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: initialData || {
      name: "",
      unit: "DAYS",
      requiresAllocation: true,
      payrollIntegrated: false,
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
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Time Off Type" : "New Time Off Type"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Annual Leave" {...field} />
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Unit" />
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
              name="requiresAllocation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requires Allocation</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Does this time off deduct from an accrued balance?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payrollIntegrated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Payroll Integrated</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Should this time off be synced to the payroll system?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
