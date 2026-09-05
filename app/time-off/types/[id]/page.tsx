import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { TimeOffTypeForm } from "@/components/time-off/TimeOffTypeForm";

export default async function EditTimeOffTypePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "timeoff:configure")) {
    redirect("/time-off/types");
  }

  const typeId = parseInt(params.id, 10);
  if (isNaN(typeId)) {
    notFound();
  }

  const type = await prisma.timeOffType.findUnique({
    where: { id: typeId },
  });

  if (!type) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <TimeOffTypeForm initialData={type} />
    </div>
  );
}
