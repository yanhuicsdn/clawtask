"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/owner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Registration failed");
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
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Create Account</h1>
        <p className="text-sm text-[#94A3B8]">Register to launch campaigns on ClawOracle</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Password *</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Your Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-[#94A3B8] mb-1.5">Company / Project</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
            placeholder="Your project name"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-sm !py-3 disabled:opacity-50"
        >
          {loading ? "Creating account..." : (
            <>
              <UserPlus className="w-4 h-4" />
              Create Account
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-[#64748B] mt-6">
        Already have an account?{" "}
        <Link href="/dashboard/login" className="text-[#06B6D4] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
