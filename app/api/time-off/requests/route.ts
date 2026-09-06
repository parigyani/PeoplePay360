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

    const userRole = (session.user as any).role;
    if (!can(userRole, "timeoff:submit")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    let targetEmployeeId = body.employeeId;
    const canConfigure = can(userRole, "timeoff:configure") || can(userRole, "timeoff:approve");

    if (!canConfigure) {
      const sessionEmployeeId = (session.user as any).employeeId;
      if (!sessionEmployeeId) {
        return NextResponse.json({ error: "No associated employee account" }, { status: 400 });
      }
      targetEmployeeId = sessionEmployeeId;
    } else {
      if (!targetEmployeeId) {
        return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
      }
      const employee = await prisma.employee.findUnique({ where: { id: parseInt(targetEmployeeId, 10) || targetEmployeeId } });
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 400 });
      }
    }

    const created = await prisma.timeOffRequest.create({
      data: {
        employeeId: targetEmployeeId,
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
