import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const structureId = searchParams.get("structureId");

  const rules = await prisma.salaryRule.findMany({
    where: structureId ? { structureId: parseInt(structureId, 10) } : undefined,
    orderBy: { sequence: 'asc' },
    include: {
      structure: { select: { name: true } }
    }
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "rule:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { structureId, name, code, category, sequence, method, value, formula } = body;

    const existing = await prisma.salaryRule.findFirst({
      where: { structureId: parseInt(structureId, 10), code }
    });
    if (existing) {
      return NextResponse.json({ error: "Rule code must be unique within the structure" }, { status: 400 });
    }

    const rule = await prisma.salaryRule.create({
      data: {
        structureId: parseInt(structureId, 10),
        name,
        code,
        category,
        sequence: parseInt(sequence, 10),
        method,
        value: value ? parseFloat(value.toString()) : null,
        formula: formula || null,
      }
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
