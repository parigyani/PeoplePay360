import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const patternSchema = z.object({
  day: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  breakMins: z.coerce.number().min(0),
}).refine((data) => {
  const [startH, startM] = data.startTime.split(':').map(Number);
  const [endH, endM] = data.endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  return endTotal > startTotal && (endTotal - startTotal) > data.breakMins;
}, { message: "End time must be after start time, accounting for break" });

const scheduleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Standard", "Shift", "Flexible"]),
  patterns: z.array(patternSchema).min(1, "At least one pattern row is required"),
});

function computeWeeklyHours(patterns: z.infer<typeof patternSchema>[]) {
  let totalMins = 0;
  for (const p of patterns) {
    const [startH, startM] = p.startTime.split(':').map(Number);
    const [endH, endM] = p.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    totalMins += (endTotal - startTotal) - p.breakMins;
  }
  return Number((totalMins / 60).toFixed(2));
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (!can((session.user as any).role, "schedule:read") && !can((session.user as any).role, "schedule:write"))) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const schedules = await prisma.workingSchedule.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "schedule:write")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const data = scheduleSchema.parse(body);
    
    // Server-side compute weekly hours
    const weeklyHours = computeWeeklyHours(data.patterns);

    const schedule = await prisma.workingSchedule.create({
      data: {
        name: data.name,
        type: data.type,
        weeklyHours,
        patterns: {
          create: data.patterns.map((p) => ({
            day: p.day,
            startTime: p.startTime,
            endTime: p.endTime,
            breakMins: p.breakMins,
          })),
        },
      },
      include: {
        patterns: true,
      }
    });

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
