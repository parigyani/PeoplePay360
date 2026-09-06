import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";
import { TopNav } from "../components/TopNav";
import { ThemeProvider } from "../components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {/* Main Background */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-background" />
          <Providers>
            <TopNav />
            <main className="min-h-[calc(100vh-3.5rem)] pb-12">
              {children}
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
