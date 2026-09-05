import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { notFound, redirect } from "next/navigation";
import { TimeOffTypeForm } from "@/components/time-off/TimeOffTypeForm";

export const dynamic = "force-dynamic";

export default async function EditTimeOffTypePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!can(role, "timeoff:configure")) {
    redirect("/time-off/requests");
  }

  const idParam = (await params).id;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    notFound();
  }

  const type = await prisma.timeOffType.findUnique({
    where: { id },
  });

  if (!type) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <TimeOffTypeForm initialData={type} isViewMode={true} />
    </div>
  );
}
