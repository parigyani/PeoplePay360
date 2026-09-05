import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { applyApproval } from "@/lib/timeoff/applyApproval";

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


    const requestId = id;

    // Calls the locked business logic
    await applyApproval(requestId);

    return new NextResponse("Approved", { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
