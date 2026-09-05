"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/employees";
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm w-96">
        <h1 className="text-2xl font-semibold mb-2">Login</h1>
        
        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded mt-2 hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}
