import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { applyAllocationApproval } from "@/lib/timeoff/applyAllocationApproval";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!can(role, "timeoff:approve")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const idParam = (await params).id;
    
    const body = await req.json();
    const action = body.action; // "approve" or "refuse"

    if (action === "approve") {
      await applyAllocationApproval(idParam);
      return NextResponse.json({ success: true });
    } else if (action === "refuse") {
      const id = parseInt(idParam, 10);
      await prisma.allocation.update({
        where: { id },
        data: { status: "Refused" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Failed to action allocation", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
