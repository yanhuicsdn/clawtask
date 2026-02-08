"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto pt-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Project Dashboard</h1>
        <p className="text-sm text-[#94A3B8]">Sign in to manage your campaigns</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-sm !py-3 disabled:opacity-50"
        >
          {loading ? "Signing in..." : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[#64748B] mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/dashboard/register" className="text-[#06B6D4] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
