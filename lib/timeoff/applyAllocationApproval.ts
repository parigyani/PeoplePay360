import { prisma } from "@/lib/prisma";

export async function applyAllocationApproval(allocationId: string): Promise<void> {
  const allocId = parseInt(allocationId, 10);
  if (isNaN(allocId)) {
    throw new Error("Invalid allocation ID");
  }

  await prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.findUnique({
      where: { id: allocId },
    });

    if (!allocation) {
      throw new Error("Allocation not found");
    }

    if (allocation.status !== "To Approve") {
      throw new Error(`Allocation can only be approved if pending. Current status: ${allocation.status}`);
    }

    await tx.allocation.update({
      where: { id: allocation.id },
      data: {
        status: "Approved",
      },
    });
  });
}
