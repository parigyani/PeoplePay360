import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const typeSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresAllocation: z.boolean(),
  payrollIntegrated: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "timeoff:configure")) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await request.json();
    const data = typeSchema.parse(body);

    const type = await prisma.timeOffType.create({
      data,
    });

    return NextResponse.json(type);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 });
    }
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
