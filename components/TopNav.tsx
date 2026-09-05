"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AttendanceWidget } from "./attendance/AttendanceWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { label: "Employees", href: "/employees" },
  { label: "Contracts", href: "/contracts" },
  { label: "Attendance", href: "/attendance" },
  { label: "Time Off", href: "/time-off" },
  { label: "Payroll", href: "/payroll/structures" },
];

export function TopNav() {
  const pathname = usePathname();

  // Don't show nav on login page
  if (pathname === "/login") return null;

  function isActive(href: string) {
    if (href === "/employees") return pathname.startsWith("/employees");
    if (href === "/contracts") return pathname.startsWith("/contracts");
    if (href === "/attendance") return pathname.startsWith("/attendance");
    if (href === "/time-off") return pathname.startsWith("/time-off");
    if (href === "/payroll/structures") return pathname.startsWith("/payroll");
    return false;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[hsl(224,71%,4%)]/95 backdrop-blur-md">
      <div className="flex h-14 items-center px-6">
        {/* Logo */}
        <Link href="/employees" className="flex items-center gap-2 mr-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-sm">
            HR
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.label === "Time Off" ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""} flex items-center gap-1 focus:outline-none`}>
                  {item.label} ▼
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-[#1E2330] text-slate-200 border-white/10">
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href="/time-off/dashboard" className="w-full">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href="/time-off/requests" className="w-full">Time offs</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href="/time-off/types" className="w-full">Time off Types</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <Link href="/time-off/allocations" className="w-full">Allocations</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* Right side — status dot and attendance widget */}
        <div className="ml-auto flex items-center gap-4">
          <AttendanceWidget />
          <div className="status-dot status-dot-active" title="System Online" />
        </div>
      </div>
    </nav>
  );
}
