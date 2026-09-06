import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !can((session.user as any).role, "user:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { employeeId, email, role, isActive } = body;

    const currentUserId = parseInt((session.user as any).id, 10);
    const currentUserRole = (session.user as any).role;

    // Self-elevation check
    if (currentUserId === id && role && role !== currentUserRole) {
      return NextResponse.json(
        { error: "Forbidden: Cannot change your own role." },
        { status: 403 }
      );
    }

    // Check if email is already in use by ANOTHER user
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: "Email is already in use by another user" },
          { status: 400 }
        );
      }
    }

    // Check if employeeId is already in use by ANOTHER user
    if (employeeId) {
      const existingEmployeeUser = await prisma.user.findUnique({
        where: { employeeId },
      });
      if (existingEmployeeUser && existingEmployeeUser.id !== id) {
        return NextResponse.json(
          { error: "Selected employee is already linked to another user account" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        employeeId: employeeId !== undefined ? employeeId : undefined,
        email: email !== undefined ? email : undefined,
        role: role !== undefined ? role : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        employee: { select: { id: true, name: true, jobPosition: true } },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
