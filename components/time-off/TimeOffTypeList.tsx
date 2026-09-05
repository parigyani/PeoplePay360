"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { TimeOffType } from "@prisma/client";

export function TimeOffTypeList({ types, canConfigure }: { types: TimeOffType[], canConfigure: boolean }) {
  const [search, setSearch] = useState("");

  const filtered = types.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Types</h1>
        {canConfigure && (
          <Link href="/time-off/types/new">
            <Button className="bg-blue-600 hover:bg-blue-700">NEW</Button>
          </Link>
        )}
      </div>

      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input 
          type="search" 
          placeholder="Search types..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="bg-[#1E2330] border-white/10 text-white"
        />
      </div>

      <div className="rounded-md border border-[#2D3342] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1E2330]">
            <TableRow className="border-b-[#2D3342] hover:bg-transparent">
              <TableHead className="text-slate-400 font-medium">Type</TableHead>
              <TableHead className="text-slate-400 font-medium">Unit</TableHead>
              <TableHead className="text-slate-400 font-medium">Allocation</TableHead>
              <TableHead className="text-slate-400 font-medium">Approval</TableHead>
              <TableHead className="text-slate-400 font-medium">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-400">
                  No time off types found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((type) => (
                <TableRow key={type.id} className="border-b-[#2D3342] hover:bg-[#1E2330]/50 transition-colors">
                  <TableCell className="font-medium text-slate-100 flex items-center gap-2">
                    {type.color && (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                    )}
                    {type.name}
                  </TableCell>
                  <TableCell className="text-slate-300 capitalize">{type.unit.toLowerCase()}</TableCell>
                  <TableCell className="text-slate-300">
                    {type.requiresAllocation ? "Required" : "No"}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {type.approverRole || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={type.active ? "border-green-500/50 text-green-400 bg-green-500/10" : "border-slate-500/50 text-slate-400 bg-slate-500/10"}>
                      {type.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canConfigure && (
                      <Link href={`/time-off/types/${type.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                          Edit
                        </Button>
                      </Link>
                    )}
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
