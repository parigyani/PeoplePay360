"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export function RequestList({ requests, canApprove, currentEmployeeId }: { requests: any[], canApprove: boolean, currentEmployeeId: number | null }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [myTeamOnly, setMyTeamOnly] = useState(false);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const filtered = requests.filter(r => {
    const matchesSearch = r.employee.name.toLowerCase().includes(search.toLowerCase()) || r.type.name.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = myTeamOnly ? (r.employee.managerId === currentEmployeeId) : true;
    return matchesSearch && matchesTeam;
  });

  async function handleAction(id: number, action: "approve" | "refuse") {
    setActingOn(id);
    try {
      const response = await fetch(`/api/time-off/requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Time Off Requests</h1>
        <Link href="/time-off/requests/new">
          <Button className="bg-blue-600 hover:bg-blue-700">NEW</Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="Search employee or type..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-[#1E2330] border-white/10 text-white"
          />
        </div>
        
        {currentEmployeeId && (
          <div className="flex items-center space-x-2">
            <Switch id="my-team" checked={myTeamOnly} onCheckedChange={setMyTeamOnly} />
            <Label htmlFor="my-team" className="text-slate-300">My Team</Label>
          </div>
        )}
      </div>

      <div className="rounded-md border border-[#2D3342] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1E2330]">
            <TableRow className="border-b-[#2D3342] hover:bg-transparent">
              <TableHead className="text-slate-400 font-medium">Employee</TableHead>
              <TableHead className="text-slate-400 font-medium">Type</TableHead>
              <TableHead className="text-slate-400 font-medium">Start</TableHead>
              <TableHead className="text-slate-400 font-medium">End</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Duration</TableHead>
              <TableHead className="text-slate-400 font-medium">Status</TableHead>
              <TableHead className="text-right text-slate-400 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-slate-400">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="border-b-[#2D3342] hover:bg-[#1E2330]/50 transition-colors">
                  <TableCell className="font-medium text-slate-100">{r.employee.name}</TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      {r.type.color && (
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.type.color }} />
                      )}
                      {r.type.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{format(new Date(r.startDate), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-slate-300">{format(new Date(r.endDate), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right text-slate-300">{r.duration}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      r.status === "Approved" 
                        ? "border-green-500/50 text-green-400 bg-green-500/10" 
                        : "border-orange-500/50 text-orange-400 bg-orange-500/10"
                    }>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canApprove && r.status === "To Approve" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleAction(r.id, "refuse")}
                            disabled={actingOn === r.id}
                          >
                            Refuse
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAction(r.id, "approve")}
                            disabled={actingOn === r.id}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                      <Link href={`/time-off/requests/${r.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                          View
                        </Button>
                      </Link>
                    </div>
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
