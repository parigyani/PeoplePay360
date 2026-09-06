"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDuration(hoursDecimal: number) {
  const h = Math.floor(hoursDecimal);
  const m = Math.round((hoursDecimal - h) * 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function AttendanceWidget() {
  const [data, setData] = useState<{
    active: { checkIn: string } | null;
    todayHoursExcludingActive: number;
    employeeName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [elapsed, setElapsed] = useState<number>(0);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/attendance/widget");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data?.active) {
      const checkInTime = new Date(data.active.checkIn).getTime();
      const updateElapsed = () => {
        setElapsed((Date.now() - checkInTime) / (1000 * 60 * 60));
      };
      updateElapsed();
      const timer = setInterval(updateElapsed, 1000);
      return () => clearInterval(timer);
    } else {
      setElapsed(0);
    }
  }, [data?.active]);

  async function handleAction(action: "check-in" | "check-out") {
    try {
      setActing(true);
      const res = await fetch("/api/attendance/widget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchStatus();
      } else {
        const err = await res.json();
        alert(err.error || "Failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActing(false);
    }
  }

  if (loading || !data) return null; // Don't show if unauthenticated or loading

  const isCheckedIn = !!data.active;
  // Calculate total hours to display (API returned total hours including active session at time of fetch, 
  // but we can make it tick dynamically by adding elapsed since last fetch, though the simple way is just using the live elapsed for the active session, 
  // and using the API's totalHoursToday minus the frozen active duration, plus the live elapsed).
  // For simplicity, let's just use the API's totalHoursToday as a base and assume it ticks every minute.
  
  // Wait, `elapsed` is accurate to the second.
  // The API calculated `totalHoursToday` including the active session *at the exact time the API was called*.
  // It's easier to just rely on the API value (refreshed every minute) for "Today" and `elapsed` for the current session.

  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-2 rounded-full border border-white/10 bg-secondary p-1 pr-3 transition-colors hover:bg-secondary/80 focus:outline-none"
      >
        <div
          className={cn(
            "h-3 w-3 rounded-full ml-1",
            isCheckedIn ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
          )}
        />
        <span className="text-xs font-medium text-secondary-foreground">
          {isCheckedIn ? "Checked In" : "Check In"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-border bg-popover text-popover-foreground p-5 rounded-xl shadow-2xl" align="end" sideOffset={12}>
        <div className="flex flex-col space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Welcome back</div>
            <div className="text-xl font-semibold tracking-tight">{data.employeeName}!</div>
          </div>
          
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {isCheckedIn ? format(new Date(data.active!.checkIn), "h:mm a") : "Not active"}
                {isCheckedIn && <span className="text-muted-foreground">— Now</span>}
              </span>
              <span className="font-medium text-white">
                {isCheckedIn ? formatDuration(elapsed) : "0h00"}
              </span>
            </div>
            
            <div className="h-[1px] w-full bg-background/10 rounded-full" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today</span>
              <span className="font-medium text-white">
                {formatDuration(data.todayHoursExcludingActive + elapsed)}
              </span>
            </div>
          </div>

          <Button
            className={cn(
              "w-full font-medium h-10 mt-2",
              isCheckedIn
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            )}
            onClick={() => handleAction(isCheckedIn ? "check-out" : "check-in")}
            disabled={acting}
          >
            {acting ? "Please wait..." : isCheckedIn ? "Check Out" : "Check In"}
          </Button>
          
          <p className="text-[10px] text-muted-foreground text-center leading-tight pt-1">
            Employees can mark attendance from the quick widget and review records from the Attendance module.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
