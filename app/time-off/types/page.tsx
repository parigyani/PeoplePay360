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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Types</h1>
        {canConfigure && (
          <Link href="/time-off/types/new">
            <Button>Create New Type</Button>
          </Link>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Requires Allocation</TableHead>
              <TableHead>Payroll Integrated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No time off types configured.
                </TableCell>
              </TableRow>
            ) : (
              types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.unit}</TableCell>
                  <TableCell>
                    {type.requiresAllocation ? (
                      <Badge variant="default" className="bg-blue-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {type.payrollIntegrated ? (
                      <Badge variant="default" className="bg-green-600">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canConfigure && (
                      <Link href={`/time-off/types/${type.id}`}>
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
