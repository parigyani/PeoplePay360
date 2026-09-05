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

export default async function TimeOffTypesPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canConfigure = can(role, "timeoff:configure");

  const types = await prisma.timeOffType.findMany({
    orderBy: {
      name: 'asc',
    }
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Types</h1>
        <p className="text-muted-foreground">List view opened from Time Off ▼ → Time Off Types</p>
      </div>

      <div className="flex justify-between items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search time off types..." className="pl-8 bg-white/[0.03] border-white/[0.08]" />
        </div>
        {canConfigure && (
          <Link href="/time-off/types/new">
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
              <TableHead>Type</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Allocation</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.length === 0 ? (
              <TableRow className="border-white/[0.08]">
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No time off types configured.
                </TableCell>
              </TableRow>
            ) : (
              types.map((type) => (
                <TableRow 
                  key={type.id} 
                  className="border-white/[0.08] hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <TableCell className="font-medium">
                    <Link href={`/time-off/types/${type.id}`} className="block w-full h-full">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-${(type.color || 'Blue').toLowerCase()}-500`} />
                        {type.name}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/time-off/types/${type.id}`} className="block w-full h-full">
                      {type.unit === "DAYS" ? "Days" : "Hours"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/time-off/types/${type.id}`} className="block w-full h-full">
                      {type.requiresAllocation ? "Required" : "No"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/time-off/types/${type.id}`} className="block w-full h-full">
                      {type.approverRole || "Manager"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/time-off/types/${type.id}`} className="block w-full h-full">
                      {type.isActive !== false ? (
                        <div className="flex items-center gap-2">
                          <div className="status-dot status-dot-active" />
                          <span className="text-status-active font-medium">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="status-dot status-dot-inactive" />
                          <span className="text-status-inactive font-medium">Inactive</span>
                        </div>
                      )}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-center mt-6">
        <p className="text-xs text-muted-foreground">
          Useful note: this list defines policy rules, not employee transactions.
        </p>
      </div>
    </div>
  );
}
