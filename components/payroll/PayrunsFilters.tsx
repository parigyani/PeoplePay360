"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PayrunsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (year) params.set("year", year);
    router.push(`/payroll/payruns?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6 items-end sm:items-center">
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-500 mb-1">Payrun Name</label>
        <Input 
          type="text" 
          placeholder="Search payruns..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          className="w-full sm:w-64" 
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
        <Input 
          type="number" 
          placeholder="e.g. 2026"
          value={year} 
          onChange={e => setYear(e.target.value)} 
          className="w-full sm:w-32" 
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto">
        Filter
      </Button>
    </form>
  );
}
