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

    if (!can((session.user as any).role, "timeoff:submit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const created = await prisma.timeOffRequest.create({
      data: {
        employeeId: body.employeeId,
        typeId: body.typeId,
        startDate: body.startDate,
        endDate: body.endDate,
        duration: body.duration,
        status: "To Approve",
        approverRole: body.approverRole || null,
        reason: body.reason || null,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error("Failed to create request", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
