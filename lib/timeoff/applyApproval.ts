import { prisma } from "@/lib/prisma";

export async function applyApproval(requestId: string): Promise<void> {
  const reqId = parseInt(requestId, 10);
  if (isNaN(reqId)) {
    throw new Error("Invalid request ID");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Load the TimeOffRequest by id, including its related TimeOffType
    const request = await tx.timeOffRequest.findUnique({
      where: { id: reqId },
      include: { type: true },
    });

    if (!request) {
      throw new Error("TimeOffRequest not found");
    }

    // 2. If the request's status is not "To Approve", throw a clear error
    if (request.status !== "To Approve") {
      throw new Error(`Approval can only be applied to a "To Approve" request. Current status: ${request.status}`);
    }

    let appliedAllocationId: number | null = null;

    // 3. If requiresAllocation is true:
    if (request.type.requiresAllocation) {
      // a. Find the employee's currently valid, APPROVED Allocation for that type
      const allocations = await tx.allocation.findMany({
        where: {
          employeeId: request.employeeId,
          typeId: request.typeId,
          status: "Approved", // MUST be approved to draw from
          validFrom: {
            lte: request.startDate,
          },
          OR: [
            { validTo: null },
            { validTo: { gte: request.startDate } },
          ],
        },
        orderBy: {
          validFrom: 'asc', // take the oldest valid one first
        },
      });

      const allocation = allocations[0];

      // b. If none found, throw a clear error
      if (!allocation) {
        throw new Error("No approved and valid Allocation found for this request. Cannot deduct balance.");
      }

      if (allocation.remaining < request.duration) {
        throw new Error(`Insufficient allocation balance. Requested: ${request.duration}, Remaining: ${allocation.remaining}`);
      }

      // c. In a single transaction: increment Allocation.taken and decrement Allocation.remaining
      await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          taken: { increment: request.duration },
          remaining: { decrement: request.duration },
        },
      });

      appliedAllocationId = allocation.id;
    }

    // 4. Set the Request's status to "Approved" and link the allocation if used
    await tx.timeOffRequest.update({
      where: { id: request.id },
      data: {
        status: "Approved",
        allocationId: appliedAllocationId,
      },
    });
  });
}
