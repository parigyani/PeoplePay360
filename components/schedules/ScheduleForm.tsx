// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Plus, Trash2, Save, X } from "lucide-react";

const patternSchema = z.object({
  day: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  breakMins: z.coerce.number().min(0),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  if (isNaN(startH) || isNaN(endH)) return true;
  
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  return endTotal > startTotal && (endTotal - startTotal) > data.breakMins;
}, { message: "End > Start (accounting for break)", path: ["endTime"] });

const scheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Standard", "Shift", "Flexible"]),
  patterns: z.array(patternSchema).min(1, "At least one pattern row is required"),
  company: z.string().optional(),
  timezone: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export function ScheduleForm({ initialData, onSuccess }: ScheduleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: initialData || {
      name: initialData?.name || "",
      type: initialData?.type || "Standard",
      patterns: initialData?.patterns || [
        { day: "Monday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
        { day: "Tuesday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
        { day: "Wednesday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
        { day: "Thursday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
        { day: "Friday", startTime: "09:00", endTime: "17:00", breakMins: 60 },
      ],
      company: initialData?.company || "",
      timezone: initialData?.timezone || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "patterns",
    control: form.control,
  });

  const watchPatterns = form.watch("patterns");

  // Live-compute weekly hours
  const computedWeeklyHours = useMemo(() => {
    let totalMins = 0;
    if (!watchPatterns) return 0;
    
    for (const p of watchPatterns) {
      if (!p.startTime || !p.endTime) continue;
      const [startH, startM] = p.startTime.split(':').map(Number);
      const [endH, endM] = p.endTime.split(':').map(Number);
      if (isNaN(startH) || isNaN(endH)) continue;

      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      if (endTotal > startTotal) {
        totalMins += Math.max(0, (endTotal - startTotal) - (p.breakMins || 0));
      }
    }
    return Number((totalMins / 60).toFixed(2));
  }, [watchPatterns]);

  const computedDaysPerWeek = useMemo(() => {
    if (!watchPatterns) return 0;
    const validDays = watchPatterns.filter(p => p.startTime && p.endTime).map(p => p.day);
    return new Set(validDays).size;
  }, [watchPatterns]);

  async function onSubmit(data: ScheduleFormValues) {
    try {
      setLoading(true);
      const url = initialData?.id
        ? `/api/schedules/${initialData.id}`
        : "/api/schedules";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to save schedule");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/schedules");
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to save schedule");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold tracking-wider text-primary mb-1 uppercase">
            Working Schedule
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {initialData ? `Edit / ${initialData.name}` : "New Schedule"}
          </h1>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-xl overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground/80">Schedule Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. 40 Hours / Week"
                        className="bg-background/[0.03] border-white/[0.1] focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground/80">Calendar Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/[0.03] border-white/[0.1]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Shift">Shift</SelectItem>
                        <SelectItem value="Flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-ignore
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground/80">Company</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Company Name"
                        className="bg-background/[0.03] border-white/[0.1] focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-ignore
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground/80">Timezone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="UTC"
                        className="bg-background/[0.03] border-white/[0.1] focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                // @ts-ignore
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end pb-2">
                    <div className="flex items-center gap-3 bg-background/[0.02] border border-white/[0.05] p-3 rounded-lg">
                      <span className="text-sm text-muted-foreground/80">Status</span>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          field.value 
                            ? "bg-green-500/20 text-green-400 border-green-500/50" 
                            : "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}
                      >
                        {field.value ? "Active" : "Inactive"}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Live Computed Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/[0.02] border border-white/[0.05] p-6 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Weekly Hours</h3>
                  <p className="text-sm text-muted-foreground">Live computed from pattern rows below</p>
                </div>
                <div className="text-4xl font-bold text-primary tracking-tight">
                  {computedWeeklyHours} <span className="text-xl text-muted-foreground font-medium">h</span>
                </div>
              </div>
              
              <div className="bg-background/[0.02] border border-white/[0.05] p-6 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Days / Week</h3>
                  <p className="text-sm text-muted-foreground">Derived from scheduled days</p>
                </div>
                <div className="text-4xl font-bold text-primary tracking-tight">
                  {computedDaysPerWeek} <span className="text-xl text-muted-foreground font-medium">d</span>
                </div>
              </div>
            </div>

            {/* Weekly Patterns */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Weekly Pattern</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-background/[0.03] border-white/[0.1]"
                  onClick={() => append({ day: "Monday", startTime: "09:00", endTime: "17:00", breakMins: 60 })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Row
                </Button>
              </div>

              {form.formState.errors.patterns?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.patterns.root.message}
                </p>
              )}

              <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-background/[0.01]">
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-white/[0.08] bg-background/[0.02] text-sm font-medium text-muted-foreground">
                  <div>Day</div>
                  <div>Start Time</div>
                  <div>End Time</div>
                  <div>Break (mins)</div>
                  <div className="w-8"></div>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-4 items-start">
                      <FormField
                        control={form.control}
                        name={`patterns.${index}.day`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/[0.03] border-white/[0.1]">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                  <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`patterns.${index}.startTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                className="bg-background/[0.03] border-white/[0.1]" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`patterns.${index}.endTime`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                className="bg-background/[0.03] border-white/[0.1]" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`patterns.${index}.breakMins`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0}
                                {...field} 
                                className="bg-background/[0.03] border-white/[0.1]" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {fields.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    No pattern rows added.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                className="bg-background/[0.03] border-white/[0.1]"
                onClick={() => {
                  if (onSuccess) onSuccess();
                  else router.back();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 w-32"
              >
                {loading ? "Saving..." : (
                  <><Save className="w-4 h-4 mr-2" /> Save</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
