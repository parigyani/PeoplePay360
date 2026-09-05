import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { resolveActiveContract, NoActiveContractError } from "@/lib/payroll/resolveActiveContract";
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

export default async function ContractsListPage({
  searchParams,
}: {
  searchParams: { employeeId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const role = (session.user as any).role;
  const canWrite = can(role, "contract:write");

  const whereClause = searchParams.employeeId
    ? { employeeId: parseInt(searchParams.employeeId, 10) }
    : {};

  const contracts = await prisma.contract.findMany({
    where: whereClause,
    include: {
      employee: true,
    },
    orderBy: {
      startDate: 'desc',
    }
  });

  // Determine active contracts for all employees shown
  const activeContractIds = new Set<number>();
  const uniqueEmployeeIds = Array.from(new Set(contracts.map((c) => c.employeeId)));

  const now = new Date();
  await Promise.all(
    uniqueEmployeeIds.map(async (empId) => {
      try {
        const active = await resolveActiveContract(empId.toString(), now);
        if (active) {
          activeContractIds.add(active.id);
        }
      } catch (err) {
        if (err instanceof NoActiveContractError) {
          // It's fine, no active contract for this employee
        } else {
          console.error(err);
        }
      }
    })
  );

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
        {canWrite && (
          <Link href="/contracts/new">
            <Button>Create New Contract</Button>
          </Link>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Job Position</TableHead>
              <TableHead>Wage</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">
                  No contracts found.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => {
                const isActive = activeContractIds.has(contract.id);
                return (
                  <TableRow
                    key={contract.id}
                    className={isActive ? "bg-green-50/50 hover:bg-green-50/80 dark:bg-green-900/10 dark:hover:bg-green-900/20" : ""}
                  >
                    <TableCell className="font-medium">
                      {contract.employee.name}
                    </TableCell>
                    <TableCell>{contract.department}</TableCell>
                    <TableCell>{contract.jobPosition}</TableCell>
                    <TableCell>${contract.wage.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(contract.startDate), "PPP")}</TableCell>
                    <TableCell>
                      {contract.endDate
                        ? format(new Date(contract.endDate), "PPP")
                        : "Ongoing"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 items-start">
                        <Badge variant="secondary">{contract.status}</Badge>
                        {isActive && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canWrite && (
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
