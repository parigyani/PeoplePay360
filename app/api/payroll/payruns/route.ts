import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { resolveActiveContract } from "@/lib/payroll/resolveActiveContract";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:read")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const payruns = await prisma.payrun.findMany({
      include: {
        _count: {
          select: { payslips: true }
        }
      },
      orderBy: { periodStart: 'desc' }
    });

    return NextResponse.json(payruns);
  } catch (error) {
    console.error("GET /api/payroll/payruns error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:write")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const { name, structureId, periodStart, periodEnd, employeeIds } = body;

    if (!name || !structureId || !periodStart || !periodEnd || !employeeIds || !Array.isArray(employeeIds)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);

    // Resolve contracts first
    const payslipsData: any[] = [];
    for (const empId of employeeIds) {
      const contract = await resolveActiveContract(empId.toString(), pStart);
      if (!contract) {
        throw new Error(`No active contract found for employee ID ${empId}`);
      }
      payslipsData.push({
        employeeId: empId,
        contractId: contract.id,
        workedDays: 0,
        lines: {},
        gross: 0,
        net: 0,
        status: "DRAFT"
      });
    }

    const payrun = await prisma.$transaction(async (tx) => {
      return await tx.payrun.create({
        data: {
          name,
          structureId: structureId,
          periodStart: pStart,
          periodEnd: pEnd,
          status: "DRAFT",
          payslips: {
            create: payslipsData
          }
        },
      });
    });

    return NextResponse.json(payrun, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/payroll/payruns error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
