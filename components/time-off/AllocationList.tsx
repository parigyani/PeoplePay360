"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function AllocationList({ allocations, canApprove }: { allocations: any[], canApprove: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = allocations.filter(a => 
    a.employee.name.toLowerCase().includes(search.toLowerCase()) || 
    a.type.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Allocations</h1>
        {canApprove && (
          <Link href="/time-off/allocations/new">
            <Button className="bg-blue-600 hover:bg-blue-700">NEW</Button>
          </Link>
        )}
      </div>

      {canApprove && (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search employee or type..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-[#1E2330] border-white/10 text-white"
          />
        </div>
      )}

      <div className="rounded-md border border-[#2D3342] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1E2330]">
            <TableRow className="border-b-[#2D3342] hover:bg-transparent">
              {canApprove && <TableHead className="text-slate-400 font-medium">Employee</TableHead>}
              <TableHead className="text-slate-400 font-medium">Time Off Type</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Allocated</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Taken</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Remaining</TableHead>
              <TableHead className="text-slate-400 font-medium">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canApprove ? 7 : 6} className="text-center h-24 text-slate-400">
                  No allocations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((allocation) => (
                <TableRow key={allocation.id} className="border-b-[#2D3342] hover:bg-[#1E2330]/50 transition-colors">
                  {canApprove && <TableCell className="font-medium text-slate-100">{allocation.employee.name}</TableCell>}
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      {allocation.type.color && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: allocation.type.color }} />
                      )}
                      {allocation.type.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-300">{allocation.allocated}</TableCell>
                  <TableCell className="text-right text-slate-300">{allocation.taken}</TableCell>
                  <TableCell className="text-right text-slate-300 font-bold">{allocation.remaining}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      allocation.status === "Approved" 
                        ? "border-green-500/50 text-green-400 bg-green-500/10" 
                        : "border-orange-500/50 text-orange-400 bg-orange-500/10"
                    }>
                      {allocation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/time-off/allocations/${allocation.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
