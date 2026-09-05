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

const requestSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  typeId: z.string().min(1, "Time Off Type is required"),
  startDate: z.date({ required_error: "Start Date is required" }),
  endDate: z.date({ required_error: "End Date is required" }),
  duration: z.coerce.number().positive("Duration must be positive"),
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
  types: { id: number; name: string; unit: string }[];
}

export function RequestForm({ initialData, employees, types }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // If status is APPROVED or REFUSED, we shouldn't allow editing.
  // The UI will probably just hide the edit button, but just in case:
  const isReadOnly = initialData?.status === "APPROVED" || initialData?.status === "REFUSED";

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: initialData || {
      employeeId: "",
      typeId: "",
      startDate: undefined,
      endDate: undefined,
      duration: 0,
    },
  });

  async function onSubmit(data: RequestFormValues) {
    if (isReadOnly) return;
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/time-off/requests/${initialData.id}`
        : "/api/time-off/requests";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "PENDING" }), // always set to PENDING on edit/create
      });

      if (!res.ok) {
        throw new Error("Failed to save request");
      }

      router.push("/time-off/requests");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Request" : "New Time Off Request"}</CardTitle>
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
                      disabled={isReadOnly}
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
                      disabled={isReadOnly}
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
                            {t.name} ({t.unit})
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
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>Start Date</FormLabel>
                    <DatePicker
                      disabled={isReadOnly}
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-2">
                    <FormLabel>End Date</FormLabel>
                    <DatePicker
                      disabled={isReadOnly}
                      date={field.value}
                      setDate={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isReadOnly} 
                        type="number" 
                        step="0.5" 
                        placeholder="e.g. 2.5" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {!isReadOnly && (
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
                  {loading ? "Saving..." : "Save Request"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
