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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const allocationSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  typeId: z.string().min(1, "Time Off Type is required"),
  allocated: z.coerce.number().min(0, "Allocated must be positive"),
  validFrom: z.date({ required_error: "Valid From date is required" }),
  validTo: z.date().optional().nullable(),
}).refine(
  (data) => !data.validTo || data.validTo >= data.validFrom,
  {
    message: "Valid To cannot be earlier than Valid From",
    path: ["validTo"],
  }
);

export type AllocationFormValues = z.infer<typeof allocationSchema>;

interface AllocationFormProps {
  initialData?: AllocationFormValues & { id?: number; taken?: number; remaining?: number };
  employees: { id: number; name: string }[];
  types: { id: number; name: string }[];
}

export function AllocationForm({ initialData, employees, types }: AllocationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationSchema),
    defaultValues: initialData || {
      employeeId: "",
      typeId: "",
      allocated: 0,
      validFrom: undefined,
      validTo: null,
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

      router.push("/time-off/allocations");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save allocation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Allocation" : "New Allocation"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allocated"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocated Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {initialData && (
                <div className="flex gap-4">
                  <FormItem className="flex-1">
                    <FormLabel>Taken (Read-Only)</FormLabel>
                    <FormControl>
                      <Input disabled value={initialData.taken ?? 0} />
                    </FormControl>
                  </FormItem>
                  <FormItem className="flex-1">
                    <FormLabel>Remaining (Read-Only)</FormLabel>
                    <FormControl>
                      <Input disabled value={initialData.remaining ?? 0} />
                    </FormControl>
                  </FormItem>
                </div>
              )}

              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Valid From</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Valid To (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                        />
                      </div>
                      {field.value && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => field.onChange(null)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
