import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const contractSchema = z.object({
  employeeId: z.string().min(1),
  department: z.string().min(1),
  jobPosition: z.string().min(1),
  wage: z.coerce.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  structureId: z.string().min(1),
  scheduleId: z.string().optional(),
  status: z.string().min(1),
}).refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  { message: "End Date cannot be earlier than Start Date" }
);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "contract:write")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const data = contractSchema.parse({
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
    });

    if (data.status === "Active") {
      const existingActiveContracts = await prisma.contract.findMany({
        where: {
          employeeId: parseInt(data.employeeId, 10),
          status: "Active",
        },
      });
      const start1 = data.startDate.getTime();
      const end1 = data.endDate ? data.endDate.getTime() : Infinity;
      for (const existing of existingActiveContracts) {
        const start2 = existing.startDate.getTime();
        const end2 = existing.endDate ? existing.endDate.getTime() : Infinity;
        if (Math.max(start1, start2) <= Math.min(end1, end2)) {
          return new NextResponse(JSON.stringify({ error: "Overlapping active contract exists" }), { status: 400 });
        }
      }
    }

    const contract = await prisma.$transaction(async (tx) => {
      const newContract = await tx.contract.create({
        data: {
          employeeId: parseInt(data.employeeId, 10),
          department: data.department,
          jobPosition: data.jobPosition,
          wage: data.wage,
          startDate: data.startDate,
          endDate: data.endDate,
          structureId: parseInt(data.structureId, 10),
          status: data.status,
          code: `CON/${data.startDate.getFullYear()}/${Math.floor(Math.random() * 10000)}`,
        },
      });

      // Update employee schedule if a new one was selected
      if (data.scheduleId && data.scheduleId !== "none") {
        await tx.employee.update({
          where: { id: parseInt(data.employeeId, 10) },
          data: { scheduleId: parseInt(data.scheduleId, 10) },
        });
      }

      return newContract;
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
