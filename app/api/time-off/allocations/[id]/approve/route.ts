import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "timeoff:approve")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const allocationId = parseInt((await params).id, 10);
    if (isNaN(allocationId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
    });

    if (!allocation || allocation.status !== "PENDING") {
      return new NextResponse("Allocation not found or not pending", { status: 400 });
    }

    const updated = await prisma.allocation.update({
      where: { id: allocationId },
      data: {
        status: "APPROVED",
        approverId: parseInt((session.user as any).id, 10),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
