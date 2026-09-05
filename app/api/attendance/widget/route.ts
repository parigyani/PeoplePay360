import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeWorkedHours, computeStatus } from "@/lib/attendance";
import { can } from "@/lib/rbac";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).employeeId) {
    return NextResponse.json({ error: "Unauthorized or no employee ID" }, { status: 401 });
  }

  const employeeId = (session.user as any).employeeId;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      schedule: {
        include: { patterns: true }
      }
    }
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const active = await prisma.attendance.findFirst({
    where: { employeeId, checkOut: null },
    orderBy: { checkIn: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = await prisma.attendance.findMany({
    where: { employeeId, checkIn: { gte: today } },
  });

  let todayHoursExcludingActive = 0;
  for (const s of todaySessions) {
    if (s.workedHours) {
      todayHoursExcludingActive += s.workedHours;
    }
  }

  return NextResponse.json({
    active,
    todayHoursExcludingActive,
    employeeName: employee.name,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!can((session.user as any).role, "attendance:submit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employeeId = (session.user as any).employeeId;
  const { action } = await request.json(); // "check-in" | "check-out"

  if (action === "check-in") {
    // Prevent double check-in
    const active = await prisma.attendance.findFirst({
      where: { employeeId, checkOut: null },
    });
    if (active) return NextResponse.json({ error: "Already checked in" }, { status: 400 });

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { schedule: { include: { patterns: true } } },
    });

    const patterns = employee?.schedule?.patterns || [];
    const checkInTime = new Date();
    const status = computeStatus(checkInTime, patterns);

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        checkIn: checkInTime,
        status,
        isManualEntry: false,
      },
    });
    return NextResponse.json(record);
  } else if (action === "check-out") {
    const active = await prisma.attendance.findFirst({
      where: { employeeId, checkOut: null },
      orderBy: { checkIn: "desc" },
    });
    if (!active) return NextResponse.json({ error: "Not checked in" }, { status: 400 });

    const checkOutTime = new Date();
    const workedHours = computeWorkedHours(active.checkIn, checkOutTime);

    const record = await prisma.attendance.update({
      where: { id: active.id },
      data: {
        checkOut: checkOutTime,
        workedHours,
      },
    });
    return NextResponse.json(record);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
