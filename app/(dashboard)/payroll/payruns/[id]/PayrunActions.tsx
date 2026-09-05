"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PayrunStatus } from "@prisma/client";

interface PayrunActionsProps {
  payrunId: number;
  status: PayrunStatus;
}

export function PayrunActions({ payrunId, status }: PayrunActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payroll/payruns/${payrunId}/${action}`, {
        method: "POST"
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Action failed");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "PAID") {
    return <div className="font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-md border border-green-200">PAID</div>;
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2 items-center">
        {(status === "DRAFT" || status === "COMPUTED") && (
          <Button 
            onClick={() => handleAction("compute")} 
            disabled={loading}
            variant={status === "COMPUTED" ? "secondary" : "default"}
          >
            {loading ? "Computing..." : (status === "DRAFT" ? "Compute" : "Recompute")}
          </Button>
        )}

        {(status === "DRAFT" || status === "COMPUTED") && (
          <div title={status === "DRAFT" ? "Compute the payrun first" : undefined}>
            <Button 
              onClick={() => handleAction("validate")} 
              disabled={loading || status === "DRAFT"}
            >
              {loading ? "Validating..." : "Validate"}
            </Button>
          </div>
        )}

        {status === "VALIDATED" && (
          <Button onClick={() => handleAction("mark-paid")} disabled={loading}>
            {loading ? "Processing..." : "Mark Paid"}
          </Button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2 max-w-sm text-right bg-red-50 p-2 rounded border border-red-100">{error}</p>}
    </div>
  );
}
