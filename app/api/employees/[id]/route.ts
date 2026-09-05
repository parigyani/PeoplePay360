import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import * as z from "zod";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  department: z.string().min(1, "Department is required").optional(),
  jobPosition: z.string().min(1, "Job position is required").optional(),
  managerId: z.number().nullable().optional(),
  scheduleId: z.number().nullable().optional(),
  status: z.string().min(1, "Status is required").optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: true,
        schedule: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can((session.user as any).role, "employee:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const result = employeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.issues }, { status: 400 });
    }

    // Check if the employee is being set as their own manager
    if (result.data.managerId === id) {
      return NextResponse.json({ error: "Employee cannot be their own manager" }, { status: 400 });
    }

    const data = result.data;
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.department !== undefined && { department: data.department }),
        ...(data.jobPosition !== undefined && { jobPosition: data.jobPosition }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.scheduleId !== undefined && { scheduleId: data.scheduleId }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("PATCH /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
