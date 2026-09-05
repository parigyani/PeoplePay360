import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rule = await prisma.salaryRule.findUnique({
    where: { id: parseInt(id, 10) }
  });
  if (!rule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rule);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "rule:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { structureId, name, code, category, sequence, method, value, formula } = body;

    if (code) {
      const existing = await prisma.salaryRule.findFirst({
        where: { 
          structureId: parseInt(structureId, 10), 
          code, 
          NOT: { id: parseInt(id, 10) } 
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Rule code must be unique within the structure" }, { status: 400 });
      }
    }

    const rule = await prisma.salaryRule.update({
      where: { id: parseInt(id, 10) },
      data: {
        structureId: parseInt(structureId, 10),
        name,
        code,
        category,
        sequence: parseInt(sequence, 10),
        method,
        value: value !== undefined && value !== null ? parseFloat(value.toString()) : null,
        formula: formula || null,
      }
    });

    return NextResponse.json(rule);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "rule:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.salaryRule.delete({
      where: { id: parseInt(id, 10) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
