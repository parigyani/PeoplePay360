import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default async function AllocationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canConfigure = can(role, "timeoff:configure");

  const allocations = await prisma.allocation.findMany({
    include: {
      employee: true,
      type: true,
    },
    orderBy: {
      validFrom: 'desc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Allocations</h1>
        <p className="text-muted-foreground">List view opened from Time Off ▼ → Allocations</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search allocations..." className="pl-8 bg-white/[0.03] border-white/[0.08]" />
        </div>
        {canConfigure && (
          <Link href="/time-off/allocations/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              + NEW
            </Button>
          </Link>
        )}
      </div>

      <div className="glass-card rounded-md border border-white/[0.08] overflow-hidden">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="border-white/[0.08]">
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Taken</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No allocations configured.
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((alloc) => {
                const isApproved = alloc.status === "APPROVED";
                const isPending = alloc.status === "PENDING";
                return (
                  <TableRow 
                    key={alloc.id} 
                    className="border-white/[0.08] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <TableCell className="font-medium">
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        {alloc.employee.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-${(alloc.type.color || 'Blue').toLowerCase()}-500`} />
                          {alloc.type.name}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        {alloc.allocated}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        {alloc.taken}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        {alloc.remaining}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/time-off/allocations/${alloc.id}`} className="block w-full h-full">
                        {isApproved && (
                          <div className="flex items-center gap-2">
                            <div className="status-dot status-dot-active" />
                            <span className="text-status-active font-medium">Approved</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            <span className="text-amber-500 font-medium">To Approve</span>
                          </div>
                        )}
                        {!isApproved && !isPending && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <span className="text-red-500 font-medium">Refused</span>
                          </div>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-xs text-muted-foreground">
          Useful note: the list should expose the balance math at a glance — Allocated, Taken and Remaining.
        </p>
      </div>
    </div>
  );
}
