import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Allocations</h1>
        {canConfigure && (
          <Link href="/time-off/allocations/new">
            <Button>Create New Allocation</Button>
          </Link>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Taken</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  No allocations found.
                </TableCell>
              </TableRow>
            ) : (
              allocations.map((alloc) => (
                <TableRow key={alloc.id}>
                  <TableCell className="font-medium">{alloc.employee.name}</TableCell>
                  <TableCell>{alloc.type.name}</TableCell>
                  <TableCell>{alloc.allocated}</TableCell>
                  <TableCell>{alloc.taken}</TableCell>
                  <TableCell>{alloc.remaining}</TableCell>
                  <TableCell>{format(new Date(alloc.validFrom), "PPP")}</TableCell>
                  <TableCell>
                    {alloc.validTo ? format(new Date(alloc.validTo), "PPP") : "Forever"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canConfigure && (
                      <Link href={`/time-off/allocations/${alloc.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
