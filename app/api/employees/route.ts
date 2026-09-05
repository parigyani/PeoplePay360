import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import * as z from "zod";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  jobPosition: z.string().min(1, "Job position is required"),
  managerId: z.number().nullable().optional(),
  scheduleId: z.number().nullable().optional(),
  status: z.string().min(1, "Status is required"),
  phone: z.string().optional().nullable(),
  workLocation: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      include: {
        manager: true,
        schedule: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!can((session.user as any).role, "employee:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = employeeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.issues }, { status: 400 });
    }

    const data = result.data;
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        department: data.department,
        jobPosition: data.jobPosition,
        managerId: data.managerId ?? null,
        scheduleId: data.scheduleId ?? null,
        status: data.status,
        phone: data.phone ?? null,
        workLocation: data.workLocation ?? null,
        company: data.company ?? null,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
