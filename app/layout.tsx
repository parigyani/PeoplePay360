import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";
import { TopNav } from "../components/TopNav";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Background Gradients/Mesh for all pages */}
        <div className="fixed top-0 left-0 w-full h-full opacity-20 pointer-events-none -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/40 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/40 blur-[120px]" />
        </div>
        <Providers>
          <TopNav />
          <main className="min-h-[calc(100vh-3.5rem)] pb-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
