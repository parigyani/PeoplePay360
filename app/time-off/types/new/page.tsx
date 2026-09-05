import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { TimeOffTypeForm } from "@/components/time-off/TimeOffTypeForm";

export default async function NewTimeOffTypePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "timeoff:configure")) {
    redirect("/time-off/types");
  }

  return (
    <div className="container mx-auto py-10">
      <TimeOffTypeForm />
    </div>
  );
}
