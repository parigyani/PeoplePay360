import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const allocationSchema = z.object({
  employeeId: z.string().min(1),
  typeId: z.string().min(1),
  allocated: z.coerce.number().min(0),
  validFrom: z.coerce.date(),
  validTo: z.coerce.date().nullable().optional(),
}).refine(
  (data) => !data.validTo || data.validTo >= data.validFrom,
  { message: "Valid To cannot be earlier than Valid From" }
);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "timeoff:configure")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const allocationId = parseInt(id, 10);
    if (isNaN(allocationId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const body = await request.json();
    const data = allocationSchema.parse({
      ...body,
      validFrom: new Date(body.validFrom),
      validTo: body.validTo ? new Date(body.validTo) : null,
    });

    // We must fetch existing to properly recalculate 'remaining'
    const existing = await prisma.allocation.findUnique({
      where: { id: allocationId },
    });

    if (!existing) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const newRemaining = data.allocated - existing.taken;

    const allocation = await prisma.allocation.update({
      where: { id: allocationId },
      data: {
        employeeId: parseInt(data.employeeId, 10),
        typeId: parseInt(data.typeId, 10),
        allocated: data.allocated,
        remaining: newRemaining,
        // Notice we do NOT touch 'taken' here.
        validFrom: data.validFrom,
        validTo: data.validTo,
      },
    });

    return NextResponse.json(allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
