import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";

export default async function NewSchedulePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "schedule:write")) {
    redirect("/schedules");
  }

  return (
    <div className="container mx-auto py-10">
      <ScheduleForm />
    </div>
  );
}
