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
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">NEW</Button>
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
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-transparent">
              {canApprove && <TableHead className="text-muted-foreground font-medium">Employee</TableHead>}
              <TableHead className="text-muted-foreground font-medium">Time Off Type</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Allocated</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Taken</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Remaining</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canApprove ? 7 : 6} className="text-center h-24 text-muted-foreground">
                  No allocations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((allocation) => (
                <TableRow key={allocation.id} className="border-border hover:bg-muted/50 transition-colors">
                  {canApprove && <TableCell className="font-medium text-foreground">{allocation.employee.name}</TableCell>}
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {allocation.type.color && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: allocation.type.color }} />
                      )}
                      {allocation.type.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{allocation.allocated}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{allocation.taken}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-bold">{allocation.remaining}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      allocation.status === "Approved" 
                        ? "border-emerald-500/50 text-emerald-600 bg-emerald-500/10" 
                        : "border-amber-500/50 text-amber-600 bg-amber-500/10"
                    }>
                      {allocation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/time-off/allocations/${allocation.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 hover:bg-primary/10">
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
