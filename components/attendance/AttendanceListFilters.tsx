"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search, CalendarDays } from "lucide-react";
import { useState } from "react";

interface Props {
  employeeName?: string;
}

export function AttendanceListFilters({ employeeName }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // reset pagination if we had it, but we don't
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchQuery || null);
  };

  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    updateParam("date", today);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search employee..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={setToday} className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Today
        </Button>

        {employeeName && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2">
            Employee: {employeeName}
            <X 
              className="h-3.5 w-3.5 cursor-pointer hover:text-red-500" 
              onClick={() => updateParam("employeeId", null)}
            />
          </Badge>
        )}
        
        {searchParams.get("date") && (
          <Badge variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2">
            Date: {searchParams.get("date")}
            <X 
              className="h-3.5 w-3.5 cursor-pointer hover:text-red-500" 
              onClick={() => updateParam("date", null)}
            />
          </Badge>
        )}
      </div>
    </div>
  );
}
