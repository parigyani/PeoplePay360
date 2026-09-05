import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const requestSchema = z.object({
  employeeId: z.string().min(1),
  typeId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  duration: z.coerce.number().positive(),
  status: z.string().default("PENDING"),
  reason: z.string().nullable().optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "End Date cannot be earlier than Start Date" }
);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const data = requestSchema.parse(body);

    const req = await prisma.timeOffRequest.create({
      data: {
        employeeId: parseInt(data.employeeId, 10),
        typeId: parseInt(data.typeId, 10),
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        status: "PENDING", // Always PENDING on creation
        reason: data.reason,
      },
    });

    return NextResponse.json(req);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
