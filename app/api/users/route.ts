import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !can((session.user as any).role, "user:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId, isNewEmployee, newEmployeeName, email, role, isActive } = body;

    let finalEmployeeId = employeeId ? parseInt(employeeId, 10) : null;

    if (isNewEmployee && newEmployeeName) {
      const newEmp = await prisma.employee.create({
        data: { name: newEmployeeName, department: "TBD", jobPosition: "TBD", status: "ACTIVE" }
      });
      finalEmployeeId = newEmp.id;
    }

    if (!finalEmployeeId || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email is already in use by another user" }, { status: 400 });
    }

    // Check if employee already has a user
    const existingEmployeeUser = await prisma.user.findUnique({
      where: { employeeId: finalEmployeeId },
    });

    if (existingEmployeeUser) {
      return NextResponse.json({ error: "Selected employee is already linked to a user account" }, { status: 400 });
    }

    // Generate a secure random 12-character temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        employeeId: finalEmployeeId,
        email,
        role,
        isActive: isActive ?? true,
        password: hashedPassword,
      },
      include: {
        employee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      user,
      tempPassword,
    });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
