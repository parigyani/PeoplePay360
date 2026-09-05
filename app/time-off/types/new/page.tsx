import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TimeOffTypeForm } from "@/components/time-off/TimeOffTypeForm";

export const dynamic = "force-dynamic";

export default async function NewTimeOffTypePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!can(role, "timeoff:configure")) {
    redirect("/time-off/requests");
  }

  return (
    <div className="container mx-auto py-10">
      <TimeOffTypeForm isViewMode={false} />
    </div>
  );
}
