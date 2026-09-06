"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";

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
  workedHours: z.coerce.number().min(0).optional().nullable(),
  status: z.string().min(1, "Status is required"),
}).refine(
  (data) => !data.checkOut || data.checkOut >= data.checkIn,
  {
    message: "Check Out cannot be earlier than Check In",
    path: ["checkOut"],
  }
);

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface Props {
  initialData: AttendanceFormValues & { id: number };
  employees: { id: number; name: string }[];
  employeeDetails: any; // Include relations
}

export function AttendanceDetailView({ initialData, employees, employeeDetails }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: initialData,
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
      const res = await fetch(`/api/attendance/${initialData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const scheduledHours = employeeDetails?.schedule?.weeklyHours ? (employeeDetails.schedule.weeklyHours / 5) : 8; // Approximation
  const currentWorked = workedHoursVal || 0;
  const overtime = currentWorked > scheduledHours ? (currentWorked - scheduledHours).toFixed(2) : "0.00";

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-muted/40 pb-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Attendance / {employeeDetails?.name} / {format(new Date(initialData.checkIn), "MMM d, yyyy")}</h1>
          </div>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 mt-1">
                <Label>Department</Label>
                <Input value={employeeDetails?.department || "-"} readOnly className="bg-muted/50" />
              </div>

              <div className="space-y-2 mt-1">
                <Label>Manager</Label>
                <Input value={employeeDetails?.manager?.name || "None"} readOnly className="bg-muted/50" />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
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
                    <FormLabel>Check Out</FormLabel>
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
                        type="number" step="0.01" placeholder="0.00" 
                        value={field.value === null ? "" : field.value} 
                        onChange={(e) => {
                          setIsManualOverride(true);
                          field.onChange(e.target.value === "" ? null : parseFloat(e.target.value));
                        }} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 mt-1">
                <Label>Overtime (Est. via Schedule)</Label>
                <Input value={overtime} readOnly className="bg-muted/50 text-orange-600 font-medium" />
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 mt-1">
                <Label>Notes</Label>
                <Input readOnly value="System-generated from check in/out or manually corrected by an authorized user." className="bg-muted/50 italic text-muted-foreground" />
              </div>

            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
