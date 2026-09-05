import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { computePayslip } from "@/lib/payroll/ruleEngine";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:compute")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const payrunId = parseInt(id, 10);
    if (isNaN(payrunId)) return new NextResponse("Invalid ID", { status: 400 });

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: true,
      }
    });

    if (!payrun) return new NextResponse("Not Found", { status: 404 });

    if (payrun.status === "VALIDATED" || payrun.status === "PAID") {
      return new NextResponse("Cannot recompute a payrun that is already validated or paid", { status: 400 });
    }

    // Compute payslips (we do this outside the main transaction because
    // computePayslip itself executes Prisma queries, and mixing interactive 
    // transactions with external queries is fragile in Prisma).
    const computedResults: any[] = [];
    let payrunHasWarnings = false;

    for (const payslip of payrun.payslips) {
      const result = await computePayslip(payslip.employeeId.toString(), payrun);
      const hasWarnings = result.warnings.length > 0;
      if (hasWarnings) payrunHasWarnings = true;
      
      computedResults.push({
        payslipId: payslip.id,
        status: hasWarnings ? "WARNING" : "COMPUTED",
        lines: result.lines,
        gross: result.gross,
        net: result.net,
        warnings: result.warnings
      });
    }

    // Wrap the writes in a transaction
    await prisma.$transaction(async (tx) => {
      for (const res of computedResults) {
        await tx.payslip.update({
          where: { id: res.payslipId },
          data: {
            status: res.status as any,
            lines: res.lines,
            gross: res.gross,
            net: res.net,
            warnings: res.warnings
          }
        });
      }

      await tx.payrun.update({
        where: { id: payrunId },
        data: {
          status: "COMPUTED"
        }
      });
    });

    return NextResponse.json({ success: true, count: computedResults.length });
  } catch (error: any) {
    console.error("POST /api/payroll/payruns/[id]/compute error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
