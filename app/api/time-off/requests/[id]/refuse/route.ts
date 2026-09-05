import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "timeoff:approve")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return new NextResponse("Invalid ID", { status: 400 });
    }

    const req = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (req.status !== "PENDING") {
      return new NextResponse("Only PENDING requests can be refused", { status: 400 });
    }

    await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: { status: "REFUSED" },
    });

    return new NextResponse("Refused", { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
