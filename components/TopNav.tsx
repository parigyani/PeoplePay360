"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AttendanceWidget } from "./attendance/AttendanceWidget";
import { useSession, signOut } from "next-auth/react";
import { can } from "@/lib/rbac";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

const NAV_ITEMS = [
  { label: "Users", href: "/users", permission: "user:manage" },
  { 
    label: "Employees", 
    href: "/employees", 
    permission: "employee:read",
    subItems: [
      { label: "Employees", href: "/employees" },
      { label: "Working Schedule", href: "/schedules" }
    ]
  },
  { 
    label: "Contracts", 
    href: "/contracts", 
    permission: "contract:read",
    subItems: [
      { label: "All Contracts", href: "/contracts" },
    ]
  },
  { label: "Attendance", href: "/attendance", permission: "attendance:read" },
  { 
    label: "Time Off", 
    href: "/time-off", 
    permission: "timeoff:approve",
    subItems: [
      { label: "Dashboard", href: "/time-off/dashboard" },
      { label: "Time offs", href: "/time-off/requests" },
      { label: "Time off Types", href: "/time-off/types", permission: "timeoff:configure" },
      { label: "Allocations", href: "/time-off/allocations" }
    ]
  },
  { 
    label: "Payroll", 
    href: "/payroll", 
    permission: "structure:read",
    subItems: [
      { label: "Dashboard", href: "/payroll/dashboard" },
      { label: "Payruns", href: "/payroll/payruns" },
      { label: "Payslips", href: "/payroll/payslips" },
      { label: "Structures", href: "/payroll/structures" },
      { label: "Rules", href: "/payroll/rules" }
    ]
  },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  const role = (session?.user as any)?.role;

  function isActive(href: string) {
    if (href === "/employees") return pathname.startsWith("/employees");
    if (href === "/contracts") return pathname.startsWith("/contracts");
    if (href === "/attendance") return pathname.startsWith("/attendance");
    if (href === "/time-off") return pathname.startsWith("/time-off");
    if (href === "/payroll") return pathname.startsWith("/payroll");
    if (href === "/users") return pathname.startsWith("/users");
    return false;
  }

  // Filter items based on RBAC, or fallback to allowing own records (employees should see timeoff/attendance)
  const allowedItems = NAV_ITEMS.filter((item) => {
    if (!role) return false;
    
    // For standard employees, allow access to their own stuff even if they lack manager permissions
    if (role === "EMPLOYEE" && ["/attendance", "/time-off"].includes(item.href)) {
      return can(role, "own_records:read");
    }

    return can(role, item.permission);
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[hsl(224,71%,4%)]/95 backdrop-blur-md">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <Link href="/users" className="flex items-center gap-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
            HR
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {allowedItems.map((item) => {
            if (item.subItems) {
              return (
                <Popover key={item.label}>
                  <PopoverTrigger asChild>
                    <button className={`nav-link flex items-center gap-1 ${isActive(item.href) ? "nav-link-active" : ""} focus:outline-none`}>
                      {item.label} <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1 bg-[hsl(224,71%,4%)] border-white/[0.08] text-foreground" align="start">
                    {item.subItems.map((sub) => {
                      // Filter sub-items by permission if defined
                      if (sub.permission && !can(role, sub.permission)) return null;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-3 py-2 text-sm rounded-md hover:bg-white/[0.04] transition-colors"
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </PopoverContent>
                </Popover>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — status dot and attendance widget */}
        <div className="ml-auto flex items-center gap-4">
          <AttendanceWidget />
          <div className="flex items-center gap-2 border-l border-white/[0.08] pl-4">
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-medium text-destructive hover:text-destructive-foreground transition-colors bg-destructive/10 hover:bg-destructive px-2 py-1 rounded"
            >
              Sign Out
            </button>
          </div>
          <div className="status-dot status-dot-active" title="System Online" />
        </div>
      </div>
    </nav>
  );
}
