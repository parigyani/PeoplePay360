import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:validate")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const payrunId = parseInt(id, 10);
    if (isNaN(payrunId)) return new NextResponse("Invalid ID", { status: 400 });

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: { payslips: true },
    });

    if (!payrun) return new NextResponse("Not Found", { status: 404 });

    if (payrun.status !== "COMPUTED") {
      return new NextResponse("Payrun must be computed before it can be validated", { status: 400 });
    }

    const warningPayslips = payrun.payslips.filter(p => p.status === "WARNING");
    if (warningPayslips.length > 0) {
      const warningDetails = warningPayslips.map(p => `Payslip ID ${p.id}`).join(", ");
      return new NextResponse(`Cannot validate: The following payslips have warnings: ${warningDetails}`, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrunId },
        data: { status: "VALIDATED" }
      });
      await tx.payrun.update({
        where: { id: payrunId },
        data: { status: "VALIDATED" }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/payroll/payruns/[id]/validate error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
