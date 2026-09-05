'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';

interface PrintPayslipButtonProps {
  payslipId: number;
}

export function PrintPayslipButton({ payslipId }: PrintPayslipButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePrint = async () => {
    setIsLoading(true);
    try {
      // We open the route directly in a new tab which returns the PDF inline.
      window.open(`/api/payslips/${payslipId}/pdf`, '_blank');
    } catch (error) {
      console.error('Failed to open PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
    >
      <Printer className="mr-2 h-4 w-4" />
      {isLoading ? 'Loading...' : 'Print'}
    </button>
  );
}
