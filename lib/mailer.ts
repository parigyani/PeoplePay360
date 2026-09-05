import nodemailer from 'nodemailer';

export async function sendPayslipEmail({
  to,
  employeeName,
  period,
  pdfBuffer,
}: {
  to: string;
  employeeName: string;
  period: string;
  pdfBuffer: Buffer;
}): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    let transporter;

    // Use environment variables if set, otherwise fallback to Ethereal
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback to ephemeral Ethereal test account
      console.log('No SMTP config found. Generating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PeoplePay360 Payroll" <payroll@peoplepay360.local>',
      to,
      subject: `Your Payslip for ${period}`,
      text: `Hello ${employeeName},\n\nPlease find attached your payslip for the period: ${period}.\n\nBest regards,\nPeoplePay360 HR`,
      html: `<p>Hello ${employeeName},</p><p>Please find attached your payslip for the period: <strong>${period}</strong>.</p><p>Best regards,<br/>PeoplePay360 HR</p>`,
      attachments: [
        {
          filename: `payslip-${period.replace(/\s+/g, '-')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    
    if (previewUrl) {
      console.log('Test email sent! Preview URL: %s', previewUrl);
    }

    return { success: true, previewUrl };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
