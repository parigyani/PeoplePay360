"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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
        <input 
          type="text" 
          placeholder="Search payruns..." 
          value={q} 
          onChange={e => setQ(e.target.value)} 
          className="border border-gray-300 p-2 rounded-md w-full sm:w-64 text-sm" 
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
        <input 
          type="number" 
          placeholder="e.g. 2026"
          value={year} 
          onChange={e => setYear(e.target.value)} 
          className="border border-gray-300 p-2 rounded-md w-full sm:w-32 text-sm" 
        />
      </div>
      <button 
        type="submit" 
        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
      >
        Filter
      </button>
    </form>
  );
}
