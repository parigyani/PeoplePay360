import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ScheduleForm } from "@/components/schedules/ScheduleForm";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !can((session.user as any).role, "schedule:write")) {
    redirect("/schedules");
  }

  const { id } = await params;
  const scheduleId = parseInt(id, 10);
  if (isNaN(scheduleId)) {
    notFound();
  }

  const schedule = await prisma.workingSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      patterns: {
        orderBy: { id: 'asc' },
      },
    }
  });

  if (!schedule) {
    notFound();
  }

  const initialData = {
    id: schedule.id,
    name: schedule.name,
    type: schedule.type as "Standard" | "Shift" | "Flexible",
    patterns: schedule.patterns.map((p) => ({
      day: p.day,
      startTime: p.startTime,
      endTime: p.endTime,
      breakMins: p.breakMins,
    })),
  };

  return (
    <div className="container mx-auto py-10">
      <ScheduleForm initialData={initialData} />
    </div>
  );
}
