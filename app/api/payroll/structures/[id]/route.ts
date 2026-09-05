import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      rules: {
        orderBy: { sequence: 'asc' }
      }
    }
  });

  if (!structure) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(structure);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "structure:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, rules } = body;
    
    const updateTasks = [];
    if (name) {
      updateTasks.push(
        prisma.salaryStructure.update({
          where: { id: parseInt(id, 10) },
          data: { name }
        })
      );
    }
    
    if (rules && Array.isArray(rules)) {
      for (const rule of rules) {
        updateTasks.push(
          prisma.salaryRule.update({
            where: { id: rule.id },
            data: { sequence: rule.sequence }
          })
        );
      }
    }

    await prisma.$transaction(updateTasks);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update structure" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !can((session.user as any)?.role, "structure:write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.salaryStructure.delete({
      where: { id: parseInt(id, 10) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete structure" }, { status: 500 });
  }
}
