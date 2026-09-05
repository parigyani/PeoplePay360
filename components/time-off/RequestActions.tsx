"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RequestActions({ requestId }: { requestId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "approve" | "refuse") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/time-off/requests/${requestId}/${action}`, {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to ${action} request`);
      }

      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => handleAction("approve")}
        disabled={loading}
      >
        Approve
      </Button>
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => handleAction("refuse")}
        disabled={loading}
      >
        Refuse
      </Button>
    </div>
  );
}
