"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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
    <div className="flex h-screen items-center justify-center bg-[hsl(224,71%,4%)]">
      <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Header Bar */}
        <div className="bg-white/[0.02] border-b border-white/[0.1] px-8 py-4">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">HR Portal</span>
        </div>
        
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your workspace.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent border-white/[0.15] text-foreground focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-transparent border-white/[0.15] text-foreground focus-visible:ring-blue-600"
              />
              <div className="flex justify-end pt-1">
                <Link 
                  href="#" 
                  className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/[0.1]">
            <p className="text-center text-sm text-muted-foreground">
              Accounts are created by an administrator.
            </p>
            <p className="text-center text-xs text-muted-foreground/60 mt-2">
              After sign-in, show only the modules and actions allowed by the user&apos;s assigned role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
