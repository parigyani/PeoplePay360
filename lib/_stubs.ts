// TEMPORARY — DELETE ONCE lib/rbac.ts and lib/payroll/resolveActiveContract.ts are pushed by teammates. Do not treat as final.
import { prisma } from "@/lib/prisma";

export const can = (_role?: any, _action?: string) => true;

export async function resolveActiveContract(employeeId: string, _periodDate: Date) {
  return prisma.contract.findFirst({ where: { employeeId: parseInt(employeeId, 10) } });
}
