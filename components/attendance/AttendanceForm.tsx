"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeWorkedHours } from "@/lib/attendance";

const formatDateTimeLocal = (date?: Date | null) => {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const parseDateTimeLocal = (val: string) => {
  if (!val) return undefined;
  return new Date(val);
}

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  checkIn: z.date({ required_error: "Check In is required" }),
  checkOut: z.date().optional().nullable(),
  workedHours: z.number().min(0, "Worked hours cannot be negative").nullable().optional(),
  status: z.string().min(1, "Status is required"),
}).refine(
  (data) => !data.checkOut || data.checkOut > data.checkIn,
  {
    message: "Check Out must be later than Check In",
    path: ["checkOut"],
  }
).refine(
  (data) => {
    if (data.workedHours !== null && data.workedHours !== undefined && data.checkOut) {
      const elapsed = (data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60);
      if (data.workedHours > Math.max(4, elapsed * 2)) return false;
    }
    return true;
  },
  {
    message: "Worked hours is wildly inconsistent with elapsed time",
    path: ["workedHours"],
  }
);

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  initialData?: AttendanceFormValues & { id?: number };
  employees: { id: number; name: string }[];
}

export function AttendanceForm({ initialData, employees }: AttendanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: initialData || {
      employeeId: "",
      checkIn: undefined,
      checkOut: null,
      workedHours: null,
      status: "Present",
    },
  });

  const checkInVal = useWatch({ control: form.control, name: "checkIn" });
  const checkOutVal = useWatch({ control: form.control, name: "checkOut" });
  const workedHoursVal = useWatch({ control: form.control, name: "workedHours" });

  useEffect(() => {
    if (!isManualOverride && checkInVal && checkOutVal) {
      const computed = computeWorkedHours(checkInVal, checkOutVal);
      if (computed !== null && computed !== workedHoursVal) {
        form.setValue("workedHours", Number(computed.toFixed(2)));
      }
    }
  }, [checkInVal, checkOutVal, form, isManualOverride, workedHoursVal]);

  async function onSubmit(data: AttendanceFormValues) {
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/attendance/${initialData.id}`
        : "/api/attendance";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        // Always pass isManualEntry as true when submitted from this manual form
        body: JSON.stringify({ ...data, isManualEntry: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save attendance");
      }

      router.push(`/attendance?employeeId=${data.employeeId}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Attendance" : "Manual Attendance Entry"}</CardTitle>
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
                        <SelectItem value="Present">Present</SelectItem>
                        <SelectItem value="Late">Late</SelectItem>
                        <SelectItem value="Absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check In</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={formatDateTimeLocal(field.value)}
                        onChange={(e) => field.onChange(parseDateTimeLocal(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkOut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check Out (Optional)</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={formatDateTimeLocal(field.value)}
                        onChange={(e) => field.onChange(parseDateTimeLocal(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workedHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worked Hours</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        value={field.value === null ? "" : field.value} 
                        onChange={(e) => {
                          setIsManualOverride(true);
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          field.onChange(val);
                        }} 
                      />
                    </FormControl>
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
                {loading ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
