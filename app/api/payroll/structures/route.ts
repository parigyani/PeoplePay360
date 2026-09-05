import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/_stubs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const structures = await prisma.salaryStructure.findMany({
    include: {
      _count: {
        select: { rules: true, contracts: true }
      }
    }
  });
  return NextResponse.json(structures);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "structure:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const structure = await prisma.salaryStructure.create({
      data: { name }
    });

    return NextResponse.json(structure, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create structure" }, { status: 500 });
  }
}
