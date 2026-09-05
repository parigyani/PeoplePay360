import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipPDF } from '@/components/payroll/PayslipPDF';
import React from 'react';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const payslipId = parseInt(resolvedParams.id, 10);
    if (isNaN(payslipId)) {
      return new NextResponse('Invalid payslip ID', { status: 400 });
    }

    const payslip = await prisma.payslip.findUnique({
      where: { id: payslipId },
      include: {
        employee: {
          include: {
            schedule: true,
          }
        },
        payrun: true,
        contract: {
          include: {
            structure: true,
          }
        }
      },
    });

    if (!payslip) {
      return new NextResponse('Payslip not found', { status: 404 });
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(PayslipPDF, {
        payslip,
        employee: payslip.employee,
        payrun: payslip.payrun,
        contract: payslip.contract
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="payslip-${payslip.employee.name.replace(/\s+/g, '-')}-${payslip.payrun.name.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
