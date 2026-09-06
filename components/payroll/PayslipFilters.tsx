"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PayslipFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [period, setPeriod] = useState(searchParams.get("period") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (period && period !== "all") params.set("period", period);
    router.push(`/payroll/payslips?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6 items-end sm:items-center">
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-500 mb-1">Employee Name</label>
        <Input 
          type="text" 
          placeholder="Search employee..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          className="w-full sm:w-64" 
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-500 mb-1">Period (Month)</label>
        <Select 
          value={period} 
          onValueChange={(val) => setPeriod(val)}
        >
          <SelectTrigger className="w-full sm:w-48 bg-background">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
              const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        Filter
      </Button>
    </form>
  );
}
