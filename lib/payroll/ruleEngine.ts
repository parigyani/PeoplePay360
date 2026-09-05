import { Payrun, SalaryRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveActiveContract } from "@/lib/_stubs";
import { Parser } from "expr-eval";

export async function computePayslip(
  employeeId: string,
  payrun: Payrun
): Promise<{
  lines: { code: string; name: string; amount: number }[];
  gross: number;
  net: number;
  warnings: string[];
}> {
  const lines: { code: string; name: string; amount: number }[] = [];
  const warnings: string[] = [];
  let gross = 0;
  let net = 0;

  // 1. Resolve Active Contract
  const contract = await resolveActiveContract(employeeId, payrun.periodStart);
  if (!contract) {
    warnings.push("No active contract found for this period");
    return { lines, gross: 0, net: 0, warnings };
  }

  // 2. Load SalaryRules
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: payrun.structureId },
    include: {
      rules: {
        orderBy: { sequence: "asc" }
      }
    }
  });

  if (!structure) {
    warnings.push("Payrun salary structure not found");
    return { lines, gross: 0, net: 0, warnings };
  }

  const rules = structure.rules;

  // 3. Build context
  const ctx: Record<string, number> = {
    WAGE: contract.wage
  };

  // 4. Loop through rules
  const parser = new Parser();
  let grossComputedFromRule = false;
  let netComputedFromRule = false;
  let totalAllowanceBasic = 0;
  let totalDeduction = 0;

  for (const rule of rules) {
    let amount = 0;

    try {
      if (rule.method === "FIXED") {
        amount = rule.value || 0;
      } else if (rule.method === "PERCENTAGE") {
        const baseCode = rule.formula || "";
        const baseAmount = ctx[baseCode] || 0;
        amount = baseAmount * ((rule.value || 0) / 100);
      } else if (rule.method === "FORMULA") {
        if (!rule.formula) {
          throw new Error("Formula is empty");
        }
        amount = parser.evaluate(rule.formula, ctx);
      }

      // Store result in context
      ctx[rule.code] = amount;

      // Track categories for fallback calculation
      if (rule.category === "BASIC" || rule.category === "ALLOWANCE") {
        totalAllowanceBasic += amount;
      } else if (rule.category === "DEDUCTION") {
        totalDeduction += amount;
      }

      if (rule.category === "GROSS") grossComputedFromRule = true;
      if (rule.category === "NET") netComputedFromRule = true;

      lines.push({ code: rule.code, name: rule.name, amount });
    } catch (err: any) {
      warnings.push(`Error computing rule ${rule.code}: ${err.message}`);
    }
  }

  // 5. Fallback logic for Gross and Net
  gross = grossComputedFromRule && ctx["GROSS"] !== undefined ? ctx["GROSS"] : totalAllowanceBasic;
  net = netComputedFromRule && ctx["NET"] !== undefined ? ctx["NET"] : (gross - totalDeduction);

  // 6. Detect and populate warnings
  // Note: Skipping bank details check as requested, because Employee schema has no bank details field.
  const existingComputedPayslip = await prisma.payslip.findFirst({
    where: {
      employeeId: parseInt(employeeId, 10),
      payrunId: { not: payrun.id },
      status: { in: ["COMPUTED", "VALIDATED", "PAID"] },
      payrun: {
        periodStart: { lte: payrun.periodEnd },
        periodEnd: { gte: payrun.periodStart }
      }
    }
  });

  if (existingComputedPayslip) {
    warnings.push("Another COMPUTED/VALIDATED/PAID payslip already exists for this payrun");
  }

  return { lines, gross, net, warnings };
}
