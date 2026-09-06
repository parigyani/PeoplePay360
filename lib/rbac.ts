import { Role } from "@prisma/client";

const PERMISSIONS: Record<Role, string[]> = {
  [Role.EMPLOYEE]: [
    "own_records:read", "attendance:submit", "timeoff:submit"
  ],
  [Role.HR_MANAGER]: [
    "own_records:read", "attendance:submit", "timeoff:submit",
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve", "timeoff:configure"
  ],
  [Role.HR_PAYROLL_MANAGER]: [
    "own_records:read", "attendance:submit", "timeoff:submit",
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve",
    "payrun:read", "payrun:write", "payrun:compute", "payrun:validate", "payrun:mark-paid",
    "payslip:read", "payslip:write", "payslip:send",
    "structure:read", "structure:write",
    "rule:read", "rule:write"
  ],
  [Role.ADMIN]: [
    "own_records:read", "attendance:submit", "timeoff:submit",
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve", "timeoff:configure",
    "payrun:read", "payrun:write", "payrun:compute", "payrun:validate", "payrun:mark-paid",
    "payslip:read", "payslip:write", "payslip:send",
    "structure:read", "structure:write",
    "rule:read", "rule:write",
    "user:manage"
  ]
};

export function can(role: Role, action: string): boolean {
  const allowedActions = PERMISSIONS[role] || [];
  return allowedActions.includes(action);
}


