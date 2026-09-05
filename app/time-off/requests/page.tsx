import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { RequestTable } from "@/components/time-off/RequestTable";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canApprove = can(role, "timeoff:approve");

  const requests = await prisma.timeOffRequest.findMany({
    include: {
      employee: true,
      type: true,
    },
    orderBy: {
      startDate: 'desc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
        <p className="text-muted-foreground">List view opened from Time Off ▼ → Requests</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search requests..." className="pl-8 bg-white/[0.03] border-white/[0.08]" />
          </div>
          <Button variant="outline" className="bg-white/[0.03] border-white/[0.08]">
            <Users className="w-4 h-4 mr-2" /> My Team
          </Button>
        </div>
        <Link href="/time-off/requests/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            + NEW
          </Button>
        </Link>
      </div>

      <RequestTable requests={requests} canApprove={canApprove} />
      
      <div className="text-center mt-6">
        <p className="text-xs text-muted-foreground">
          Useful note: inline approval actions are only visible to authorized roles.
        </p>
      </div>
    </div>
  );
}
