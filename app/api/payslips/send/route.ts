import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipPDF } from '@/components/payroll/PayslipPDF';
import { sendPayslipEmail } from '@/lib/mailer';
import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !can((session.user as any).role, "payslip:send")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { payrunId, payslipIds } = await request.json();

    let payslips = [];

    if (payrunId) {
      if (isNaN(parseInt(payrunId, 10))) {
        return NextResponse.json({ error: 'Invalid payrun ID' }, { status: 400 });
      }

      payslips = await prisma.payslip.findMany({
        where: { payrunId: parseInt(payrunId, 10) },
        include: { employee: { include: { user: true, schedule: true } }, payrun: true, contract: { include: { structure: true } } },
      });
    } else if (payslipIds && Array.isArray(payslipIds)) {
      payslips = await prisma.payslip.findMany({
        where: { id: { in: payslipIds } },
        include: { employee: { include: { user: true, schedule: true } }, payrun: true, contract: { include: { structure: true } } },
      });
    } else {
      return NextResponse.json({ error: 'Missing payrunId or payslipIds' }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;
    const previewUrls: string[] = [];

    for (const payslip of payslips) {
      const email = payslip.employee.user?.email || 'test@example.com';

      try {
        const pdfBuffer = await renderToBuffer(
          React.createElement(PayslipPDF, {
            payslip,
            employee: payslip.employee,
            payrun: payslip.payrun,
            contract: payslip.contract
          })
        );

        const result = await sendPayslipEmail({
          to: email,
          employeeName: payslip.employee.name,
          period: payslip.payrun.name,
          pdfBuffer,
        });

        if (result.success) {
          sentCount++;
          if (result.previewUrl) {
            previewUrls.push(result.previewUrl);
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Failed to process payslip ${payslip.id}`, err);
        failedCount++;
      }
    }

    return NextResponse.json({
      total: payslips.length,
      sent: sentCount,
      failed: failedCount,
      previewUrls,
    });
  } catch (error) {
    console.error('Error in send-payslips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
