"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

type RequestType = {
  id: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: string;
  employee: { name: string };
  type: { name: string; color: string | null };
};

export function RequestTable({ 
  requests, 
  canApprove 
}: { 
  requests: RequestType[], 
  canApprove: boolean 
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleAction(e: React.MouseEvent, id: number, action: 'approve' | 'refuse') {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoadingId(id);
      const res = await fetch(`/api/time-off/requests/${id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Failed to ${action} request`);
      }
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || `Error trying to ${action} request`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="glass-card rounded-md border border-white/[0.08] overflow-hidden">
      <Table>
        <TableHeader className="bg-white/[0.02]">
          <TableRow className="border-white/[0.08]">
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow className="border-white/[0.08]">
              <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                No time off requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => {
              const isApproved = req.status === "APPROVED";
              const isPending = req.status === "PENDING";
              const isRefused = req.status === "REFUSED";

              return (
                <TableRow 
                  key={req.id} 
                  className="border-white/[0.08] hover:bg-white/[0.02] transition-colors"
                >
                  <TableCell className="font-medium cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    {req.employee.name}
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-${(req.type.color || 'Blue').toLowerCase()}-500`} />
                      {req.type.name}
                    </div>
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    {req.startDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    {req.endDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    {req.duration}
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                    {isApproved && (
                      <div className="flex items-center gap-2">
                        <div className="status-dot status-dot-active" />
                        <span className="text-status-active font-medium">Approved</span>
                      </div>
                    )}
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                        <span className="text-amber-500 font-medium">To Approve</span>
                      </div>
                    )}
                    {isRefused && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                        <span className="text-red-500 font-medium">Refused</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isPending && canApprove ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          disabled={loadingId === req.id}
                          onClick={(e) => handleAction(e, req.id, 'approve')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          disabled={loadingId === req.id}
                          onClick={(e) => handleAction(e, req.id, 'refuse')}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Refuse
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground" onClick={() => router.push(`/time-off/requests/${req.id}`)}>
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
