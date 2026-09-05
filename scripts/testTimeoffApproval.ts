import { prisma } from "../lib/prisma";
import { applyApproval } from "../lib/timeoff/applyApproval";

async function main() {
  console.log("Seeding test data for TimeOffApproval test...");

  // 1. Ensure an Employee exists
  const employee = await prisma.employee.upsert({
    where: { id: 9999 },
    update: {},
    create: {
      id: 9999,
      name: "Test User",
      department: "QA",
      jobPosition: "Tester",
      status: "Active",
    },
  });

  // 2. Ensure a TimeOffType that requires allocation exists
  const type = await prisma.timeOffType.upsert({
    where: { id: 9999 },
    update: {},
    create: {
      id: 9999,
      name: "Annual Leave",
      unit: "DAYS",
      requiresAllocation: true,
      payrollIntegrated: false,
    },
  });

  // 3. Create a valid Allocation
  const allocation = await prisma.allocation.create({
    data: {
      employeeId: employee.id,
      typeId: type.id,
      allocated: 20,
      taken: 5,
      remaining: 15,
      validFrom: new Date("2024-01-01"),
      validTo: new Date("2024-12-31"),
    },
  });

  console.log("Initial Allocation:", {
    allocated: allocation.allocated,
    taken: allocation.taken,
    remaining: allocation.remaining,
  });

  // 4. Create a PENDING request
  const request = await prisma.timeOffRequest.create({
    data: {
      employeeId: employee.id,
      typeId: type.id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-02"),
      duration: 2,
      status: "PENDING",
    },
  });

  console.log("Created PENDING request ID:", request.id);

  // 5. Test applyApproval
  console.log("Running applyApproval...");
  await applyApproval(request.id.toString());
  
  // 6. Verify changes
  const updatedAllocation = await prisma.allocation.findUnique({
    where: { id: allocation.id }
  });
  
  const updatedRequest = await prisma.timeOffRequest.findUnique({
    where: { id: request.id }
  });

  console.log("Final Allocation:", {
    allocated: updatedAllocation?.allocated,
    taken: updatedAllocation?.taken,
    remaining: updatedAllocation?.remaining,
  });
  console.log("Final Request Status:", updatedRequest?.status);

  // Assertions
  if (updatedAllocation?.taken === 7 && updatedAllocation?.remaining === 13) {
    console.log("✅ Taken and Remaining successfully updated!");
  } else {
    console.error("❌ Allocation math is incorrect!");
  }

  if (updatedRequest?.status === "APPROVED") {
    console.log("✅ Request status is APPROVED!");
  } else {
    console.error("❌ Request status did not update properly!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
