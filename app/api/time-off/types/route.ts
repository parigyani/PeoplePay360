import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!can(role, "timeoff:configure")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const created = await prisma.timeOffType.create({
      data: {
        name: body.name,
        unit: body.unit,
        requiresAllocation: body.requiresAllocation,
        payrollIntegrated: body.payrollIntegrated || false,
        active: body.active,
        approverRole: body.approverRole || null,
        payrollCode: body.payrollCode || null,
        color: body.color || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Failed to create time off type", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
