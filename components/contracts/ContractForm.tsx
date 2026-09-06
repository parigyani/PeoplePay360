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

const contractSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  department: z.string().min(1, "Department is required"),
  jobPosition: z.string().min(1, "Job Position is required"),
  wage: z.coerce.number().positive("Wage must be a positive number"),
  startDate: z.date({
    required_error: "Start Date is required",
  }),
  endDate: z.date().optional().nullable(),
  structureId: z.string().min(1, "Salary Structure is required"),
  status: z.string().min(1, "Status is required"),
}).refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  {
    message: "End Date cannot be earlier than Start Date",
    path: ["endDate"],
  }
);

export type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractFormProps {
  initialData?: ContractFormValues & { id?: number; code?: string | null };
  employees: { id: number; name: string }[];
  structures: { id: number; name: string }[];
}

export function ContractForm({ initialData, employees, structures }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: initialData || {
      employeeId: "",
      department: "",
      jobPosition: "",
      wage: 0,
      startDate: undefined,
      endDate: null,
      structureId: "",
      status: "Active",
    },
  });

  async function onSubmit(data: ContractFormValues) {
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/contracts/${initialData.id}`
        : "/api/contracts";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save contract");
      }

      router.push(`/contracts?employeeId=${data.employeeId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save contract");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{initialData?.code ? `Contract / ${initialData.code}` : "New Contract"}</CardTitle>
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
                name="structureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Structure</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Structure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {structures.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2 mt-2">
                <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-muted-foreground">
                  <strong>Note:</strong> The assigned Salary Structure defines the pay components (Basic, HRA, etc.) computed during payroll. Changing this will only affect future payruns.
                </div>
              </div>

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

              <FormField
                control={form.control}
                name="wage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wage</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
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
                    <FormLabel>End Date (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          minDate={form.watch("startDate")}
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
                {loading ? "Saving..." : "Save Contract"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
