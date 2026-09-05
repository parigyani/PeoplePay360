import { Role } from "@prisma/client";

const PERMISSIONS: Record<Role, string[]> = {
  [Role.EMPLOYEE]: [
    "own_records:read"
  ],
  [Role.HR_MANAGER]: [
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve"
  ],
  [Role.HR_PAYROLL_USER]: [
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve",
    "payrun:read", "payrun:write", "payrun:compute", "payrun:validate", "payrun:mark-paid",
    "payslip:read", "payslip:write",
    "structure:read",
    "rule:read"
  ],
  [Role.HR_PAYROLL_MANAGER]: [
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve",
    "payrun:read", "payrun:write", "payrun:compute", "payrun:validate", "payrun:mark-paid",
    "payslip:read", "payslip:write",
    "structure:read", "structure:write",
    "rule:read", "rule:write"
  ],
  [Role.ADMIN]: [
    "own_records:read",
    "employee:read", "employee:write",
    "contract:read", "contract:write",
    "attendance:read", "attendance:write",
    "schedule:read", "schedule:write",
    "timeoff:approve",
    "payrun:read", "payrun:write", "payrun:compute", "payrun:validate", "payrun:mark-paid",
    "payslip:read", "payslip:write",
    "structure:read", "structure:write",
    "rule:read", "rule:write",
    "user:manage"
  ]
};

export function can(role: Role, action: string): boolean {
  const allowedActions = PERMISSIONS[role] || [];
  return allowedActions.includes(action);
}


