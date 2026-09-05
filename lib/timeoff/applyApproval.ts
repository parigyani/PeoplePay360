import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function applyApproval(requestId: string): Promise<void> {
  const reqId = parseInt(requestId, 10);
  if (isNaN(reqId)) {
    throw new Error("Invalid request ID");
  }

  // Use a transaction so all reads and writes are consistent
  await prisma.$transaction(async (tx) => {
    // 1. Load the TimeOffRequest by id, including its related TimeOffType
    const request = await tx.timeOffRequest.findUnique({
      where: { id: reqId },
      include: { type: true },
    });

    if (!request) {
      throw new Error("TimeOffRequest not found");
    }

    // 2. If the request's status is not PENDING, throw a clear error
    if (request.status !== "PENDING") {
      throw new Error(`Approval can only be applied to a PENDING request. Current status: ${request.status}`);
    }

    // 3. If requiresAllocation is true:
    let allocationIdToSave = null;
    if (request.type.requiresAllocation) {
      // Find the matching Allocation for this employeeId + typeId that is currently valid
      // (validFrom <= request.startDate, and validTo is null or >= request.startDate)
      const allocations = await tx.allocation.findMany({
        where: {
          employeeId: request.employeeId,
          typeId: request.typeId,
          validFrom: {
            lte: request.startDate,
          },
          OR: [
            { validTo: null },
            { validTo: { gte: request.startDate } },
          ],
        },
        orderBy: {
          validFrom: 'asc', // take the oldest valid one first, or arbitrary if one exists
        },
      });

      const allocation = allocations[0]; // grab the first valid allocation

      if (!allocation) {
        throw new Error("No valid Allocation found for this request. Cannot deduct balance.");
      }

      if (allocation.remaining < request.duration) {
        throw new Error(`Insufficient allocation balance. Requested: ${request.duration}, Remaining: ${allocation.remaining}`);
      }

      // Update the allocation's taken and remaining balances
      await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          taken: { increment: request.duration },
          remaining: { decrement: request.duration },
        },
      });
      
      allocationIdToSave = allocation.id;
    }

    const session = await getServerSession(authOptions);
    const approverId = session?.user ? parseInt((session.user as any).id, 10) : null;

    // Set the TimeOffRequest's status to APPROVED
    await tx.timeOffRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        approverId,
        allocationId: allocationIdToSave,
      },
    });
  });
}
