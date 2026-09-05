'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';

interface SendPayslipsButtonProps {
  payrunId: number;
}

export function SendPayslipsButton({ payrunId }: SendPayslipsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!confirm('Are you sure you want to send payslips to all employees for this payrun?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/payslips/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrunId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully sent ${data.sent} payslips. Failed: ${data.failed}.`);
        if (data.previewUrls?.length > 0) {
          console.log('Preview URLs (Ethereal):', data.previewUrls);
        }
      } else {
        alert(`Error: ${data.error || 'Failed to send payslips.'}`);
      }
    } catch (error) {
      console.error('Failed to send payslips:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      <Mail className="mr-2 h-4 w-4" />
      {isLoading ? 'Sending...' : 'Send Payslips'}
    </button>
  );
}
