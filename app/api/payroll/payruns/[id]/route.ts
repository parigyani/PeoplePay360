import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payrun:read")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const payrunId = parseInt(id, 10);
    if (isNaN(payrunId)) return new NextResponse("Invalid ID", { status: 400 });

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: {
          include: {
            employee: { select: { name: true, department: true } }
          }
        },
        structure: true
      }
    });

    if (!payrun) return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json(payrun);
  } catch (error) {
    console.error("GET /api/payroll/payruns/[id] error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
