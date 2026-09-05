import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TimeOffTypeList } from "@/components/time-off/TimeOffTypeList";

export const dynamic = "force-dynamic";

export default async function TimeOffTypesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  const canConfigure = can(role, "timeoff:configure");

  if (!canConfigure) {
    redirect("/time-off/requests");
  }

  const types = await prisma.timeOffType.findMany({
    orderBy: {
      name: 'asc',
    }
  });

  return (
    <div className="px-6 py-8">
      <TimeOffTypeList types={types} canConfigure={canConfigure} />
    </div>
  );
}
