import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/_stubs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:mark-paid")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const payrunId = parseInt(id, 10);
    if (isNaN(payrunId)) return new NextResponse("Invalid ID", { status: 400 });

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId }
    });

    if (!payrun) return new NextResponse("Not Found", { status: 404 });

    if (payrun.status !== "VALIDATED") {
      return new NextResponse("Payrun must be validated before marking as paid", { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payslip.updateMany({
        where: { payrunId },
        data: { status: "PAID" }
      });
      await tx.payrun.update({
        where: { id: payrunId },
        data: { status: "PAID" }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/payroll/payruns/[id]/mark-paid error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
