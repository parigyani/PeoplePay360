import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { UserManagementClientView } from "@/components/users/UserManagementClientView";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  
  if (!can(role, "user:manage")) {
    redirect("/employees");
  }

  const currentUserId = (session.user as any).id;

  const users = await prisma.user.findMany({
    include: {
      employee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Serialize users for client component
  const serializedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    employeeId: u.employeeId,
    employee: u.employee,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div className="px-6 py-8">
      <UserManagementClientView
        users={serializedUsers}
        employees={employees}
        currentUserId={currentUserId}
      />
    </div>
  );
}
