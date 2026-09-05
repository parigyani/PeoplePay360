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
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "End Date cannot be earlier than Start Date" }
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const body = await request.json();
    const data = requestSchema.parse(body);

    // Cannot edit non-PENDING requests
    const existing = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing || existing.status !== "PENDING") {
      return new NextResponse("Cannot edit non-PENDING request", { status: 400 });
    }

    const req = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        employeeId: parseInt(data.employeeId, 10),
        typeId: parseInt(data.typeId, 10),
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        status: "PENDING", // Resets to PENDING just in case
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
