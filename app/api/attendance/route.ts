import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import * as z from "zod";

const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date().nullable().optional(),
  workedHours: z.coerce.number().min(0).nullable().optional(),
  status: z.string().min(1),
  isManualEntry: z.boolean().default(true),
}).refine(
  (data) => !data.checkOut || data.checkOut >= data.checkIn,
  { message: "Check Out cannot be earlier than Check In" }
);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "attendance:write")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const data = attendanceSchema.parse(body);

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: parseInt(data.employeeId, 10),
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        workedHours: data.workedHours,
        status: data.status,
        isManualEntry: data.isManualEntry,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
