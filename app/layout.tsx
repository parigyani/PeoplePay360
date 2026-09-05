import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata = {
  title: "PeoplePay360",
  description: "HR & Payroll System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
