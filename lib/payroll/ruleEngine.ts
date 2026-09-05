import { Payrun } from "@prisma/client";

/**
 * Computes the payslip for a given employee and payrun.
 * 
 * @param employeeId The ID of the employee
 * @param payrun The payrun instance
 * @returns The computed payslip lines, gross, net, and any warnings
 */
export async function computePayslip(employeeId: string, payrun: Payrun): Promise<{lines: {code: string, name: string, amount: number}[], gross: number, net: number, warnings: string[]}> {
  throw new Error("Not implemented yet");
}
