"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Building2, Command, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/users";
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding/Decor */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-zinc-950 text-white p-12 relative overflow-hidden">
        {/* Background Gradients/Mesh */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600 blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex items-center gap-2 font-bold text-2xl tracking-tight">
          <div className="bg-primary/20 p-2 rounded-xl text-blue-400">
            <Command className="w-6 h-6" />
          </div>
          PeoplePay<span className="text-blue-400">360</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1]">
            Modern HR & Payroll <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Simplified.
            </span>
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Manage your employees, track attendance, and process payroll with confidence using our comprehensive enterprise platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-zinc-500">
          <Building2 className="w-5 h-5" />
          © 2026 PeoplePay360 Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[hsl(224,71%,4%)] sm:p-12 relative">
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2 font-bold text-xl tracking-tight text-white">
          <div className="bg-primary/20 p-1.5 rounded-lg text-blue-500">
            <Command className="w-5 h-5" />
          </div>
          PeoplePay<span className="text-blue-500">360</span>
        </div>

        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-400">
              Please enter your details to sign in to your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-white/[0.03] border-white/[0.1] text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all rounded-xl shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                  <Link 
                    href="#" 
                    className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11 h-12 bg-white/[0.03] border-white/[0.1] text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all rounded-xl shadow-inner"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all group overflow-hidden relative"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>

          <div className="pt-8 text-center border-t border-white/[0.05]">
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account? <Link href="#" className="font-medium text-white hover:text-blue-400 transition-colors">Contact Administrator</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
