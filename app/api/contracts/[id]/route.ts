import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import prisma from "@/lib/prisma";
import * as z from "zod";

const contractSchema = z.object({
  employeeId: z.string().min(1),
  department: z.string().min(1),
  jobPosition: z.string().min(1),
  wage: z.coerce.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  structureId: z.string().min(1),
  status: z.string().min(1),
}).refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  { message: "End Date cannot be earlier than Start Date" }
);

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "contract:write")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const contractId = parseInt(params.id, 10);
    if (isNaN(contractId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const body = await request.json();
    const data = contractSchema.parse({
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    });

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        employeeId: parseInt(data.employeeId, 10),
        department: data.department,
        jobPosition: data.jobPosition,
        wage: data.wage,
        startDate: data.startDate,
        endDate: data.endDate,
        structureId: parseInt(data.structureId, 10),
        status: data.status,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
