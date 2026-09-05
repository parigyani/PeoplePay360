import { prisma } from '../prisma';
import { Contract } from '@prisma/client';

export class NoActiveContractError extends Error {
  constructor(employeeId: string, periodDate: Date) {
    super(`No active contract found for employee ${employeeId} on ${periodDate.toISOString()}`);
    this.name = 'NoActiveContractError';
  }
}

export async function resolveActiveContract(
  employeeId: string,
  periodDate: Date
): Promise<Contract> {
  const contract = await prisma.contract.findFirst({
    where: {
      employeeId: parseInt(employeeId, 10),
      startDate: {
        lte: periodDate,
      },
      OR: [
        {
          endDate: null,
        },
        {
          endDate: {
            gte: periodDate,
          },
        },
      ],
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  if (!contract) {
    throw new NoActiveContractError(employeeId, periodDate);
  }

  return contract;
}
