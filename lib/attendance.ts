import { WeeklyPattern } from "@prisma/client";

export function computeWorkedHours(checkIn: Date, checkOut: Date | null): number | null {
  if (!checkOut) return null;
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.max(0, hours); // Ensure it's not negative
}

export function computeStatus(checkIn: Date, patterns: WeeklyPattern[]): string {
  // Get the day of the week for checkIn date (e.g. 'Monday', 'Tuesday')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[checkIn.getDay()];

  // Find pattern for this day
  const pattern = patterns.find(p => p.day.toLowerCase() === dayName.toLowerCase());

  if (!pattern) {
    // If no pattern, we'll just consider it 'Present' (maybe working on a day off)
    return "Present";
  }

  // Parse startTime from pattern (e.g. '09:00')
  const [scheduleHour, scheduleMinute] = pattern.startTime.split(':').map(Number);
  
  const checkInHour = checkIn.getHours();
  const checkInMinute = checkIn.getMinutes();

  // Calculate total minutes from start of day
  const scheduleTotalMins = scheduleHour * 60 + scheduleMinute;
  const checkInTotalMins = checkInHour * 60 + checkInMinute;

  // We allow a small grace period (e.g., 5 mins) or just strict checking
  if (checkInTotalMins > scheduleTotalMins) {
    return "Late";
  }

  return "Present";
}
