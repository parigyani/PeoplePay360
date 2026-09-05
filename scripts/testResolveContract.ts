import { PrismaClient } from '@prisma/client';
import { resolveActiveContract } from '../lib/payroll/resolveActiveContract';

const prisma = new PrismaClient();

async function main() {
  // Find emp2 (Bob Employee) who has overlapping contracts
  const emp2 = await prisma.employee.findFirst({
    where: { name: 'Bob Employee' }
  });

  if (!emp2) {
    throw new Error('Could not find Bob Employee in the database. Ensure seed data is present.');
  }

  // The overlap window is between 2024-07-01 and 2024-07-15.
  // We'll test with 2024-07-10.
  const testDate = new Date('2024-07-10T00:00:00Z');
  
  console.log(`Testing active contract resolution for Employee ID: ${emp2.id} on Date: ${testDate.toISOString()}`);
  
  const contract = await resolveActiveContract(emp2.id.toString(), testDate);
  
  console.log('--- Resolved Contract ---');
  console.log(`Contract ID: ${contract.id}`);
  console.log(`Start Date: ${contract.startDate.toISOString()}`);
  console.log(`End Date: ${contract.endDate ? contract.endDate.toISOString() : 'null'}`);
  console.log(`Job Position: ${contract.jobPosition}`);
  
  // Verify it resolved the correct contract (the later one, i.e., Senior Software Engineer)
  if (contract.jobPosition === 'Senior Software Engineer') {
    console.log('✅ SUCCESS: Resolved the correct active contract based on tie-break (LATER startDate).');
  } else {
    console.log('❌ FAILURE: Did not resolve the expected contract.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
