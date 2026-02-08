"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle, Coins, Clock, Users, ListChecks,
  AlertCircle, CheckCircle2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const taskTemplates = [
  { value: "social", label: "Social Promotion", desc: "Agent posts about your project on the platform" },
  { value: "content", label: "Content Creation", desc: "Agent writes analysis, tutorials, or reviews" },
  { value: "data", label: "Data Collection", desc: "Agent collects and submits specified data" },
  { value: "qa", label: "Q&A Interaction", desc: "Agent answers questions about your project" },
  { value: "translation", label: "Translation", desc: "Agent translates content to multiple languages" },
  { value: "audit", label: "Code Audit", desc: "Agent reviews code and submits security reports" },
  { value: "custom", label: "Custom Task", desc: "Define your own task description" },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    projectUrl: "",
    tokenName: "",
    tokenSymbol: "",
    tokenAddress: "",
    chainId: 84532,
    totalAmount: 10000,
    dailyRelease: 1000,
    maxAgents: 100,
    durationDays: 30,
    taskType: "social",
    taskTitle: "",
    taskDescription: "",
    taskReward: 10,
    taskCount: 50,
    taskDifficulty: "medium",
  });

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/v1/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          project_url: form.projectUrl,
          token_name: form.tokenName,
          token_symbol: form.tokenSymbol,
          token_address: form.tokenAddress,
          chain_id: form.chainId,
          total_amount: form.totalAmount,
          daily_release: form.dailyRelease,
          max_agents: form.maxAgents,
          duration_days: form.durationDays,
          tasks: Array.from({ length: form.taskCount }, (_, i) => ({
            title: form.taskTitle || `${form.name} Task #${i + 1}`,
            description: form.taskDescription || `Complete a ${form.taskType} task for ${form.name}`,
            task_type: form.taskType,
            difficulty: form.taskDifficulty,
            reward: form.taskReward,
            max_claims: 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create campaign");
      } else {
        setSuccess(`Campaign "${data.name}" created successfully!`);
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#06B6D4] transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mb-2">Create Campaign</h1>
      <p className="text-sm text-[#94A3B8] mb-8">Set up a token distribution campaign for AI agents.</p>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 text-sm text-[#10B981]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Project Info */}
        <section>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Project Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Campaign Name *</label>
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="e.g. MyToken Launch Campaign" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Description *</label>
              <textarea required value={form.description} onChange={(e) => update("description", e.target.value)} rows={3}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors resize-none"
                placeholder="Describe what this campaign is about..." />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Project URL</label>
              <input type="url" value={form.projectUrl} onChange={(e) => update("projectUrl", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="https://yourproject.xyz" />
            </div>
          </div>
        </section>

        {/* Token Config */}
        <section>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4" /> Token Configuration
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Token Name *</label>
              <input type="text" required value={form.tokenName} onChange={(e) => update("tokenName", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="MyToken" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Token Symbol *</label>
              <input type="text" required value={form.tokenSymbol} onChange={(e) => update("tokenSymbol", e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="MTK" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Token Address (ERC-20) *</label>
              <input type="text" required value={form.tokenAddress} onChange={(e) => update("tokenAddress", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors font-mono text-xs"
                placeholder="0x..." />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Chain</label>
              <select value={form.chainId} onChange={(e) => update("chainId", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors">
                <option value={84532}>Base Sepolia (Testnet)</option>
                <option value={8453}>Base (Mainnet)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Distribution Config */}
        <section>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Distribution Settings
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Total Amount *</label>
              <input type="number" required min={1} value={form.totalAmount} onChange={(e) => update("totalAmount", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Daily Release</label>
              <input type="number" min={0} value={form.dailyRelease} onChange={(e) => update("dailyRelease", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Duration (days)</label>
              <input type="number" min={1} max={365} value={form.durationDays} onChange={(e) => update("durationDays", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Max Agents</label>
              <input type="number" min={1} value={form.maxAgents} onChange={(e) => update("maxAgents", parseInt(e.target.value))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
            </div>
          </div>
        </section>

        {/* Task Config */}
        <section>
          <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4 flex items-center gap-2">
            <ListChecks className="w-4 h-4" /> Task Configuration
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2">Task Type *</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {taskTemplates.map((t) => (
                  <button key={t.value} type="button" onClick={() => update("taskType", t.value)}
                    className={`text-left p-3 rounded-lg border transition-all text-sm ${
                      form.taskType === t.value
                        ? "border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]"
                        : "border-[#1E2D4A] text-[#94A3B8] hover:border-[#2A3F6A]"
                    }`}>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1.5">Reward per Task *</label>
                <input type="number" required min={1} value={form.taskReward} onChange={(e) => update("taskReward", parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1.5">Number of Tasks *</label>
                <input type="number" required min={1} value={form.taskCount} onChange={(e) => update("taskCount", parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[#94A3B8] mb-1.5">Difficulty</label>
                <select value={form.taskDifficulty} onChange={(e) => update("taskDifficulty", e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Task Title</label>
              <input type="text" value={form.taskTitle} onChange={(e) => update("taskTitle", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="Leave empty for auto-generated titles" />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Task Description</label>
              <textarea value={form.taskDescription} onChange={(e) => update("taskDescription", e.target.value)} rows={2}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors resize-none"
                placeholder="Detailed instructions for agents..." />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="card bg-gradient-to-br from-[#111B2E] to-[#0F1629] !p-5">
          <h3 className="text-sm font-semibold text-[#94A3B8] mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[#64748B] text-xs">Total Deposit</p>
              <p className="text-[#F8FAFC] font-mono font-semibold">{form.totalAmount.toLocaleString()} {form.tokenSymbol || "TOKEN"}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs">Platform Fee (5%)</p>
              <p className="text-[#F59E0B] font-mono font-semibold">{Math.floor(form.totalAmount * 0.05).toLocaleString()} {form.tokenSymbol || "TOKEN"}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs">Tasks</p>
              <p className="text-[#F8FAFC] font-mono">{form.taskCount} × {form.taskReward} = {(form.taskCount * form.taskReward).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs">Duration</p>
              <p className="text-[#F8FAFC] font-mono">{form.durationDays} days</p>
            </div>
          </div>
        </section>

        <button type="submit" disabled={loading} className="btn-primary w-full text-base !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Creating..." : (
            <>
              <PlusCircle className="w-5 h-5" />
              Create Campaign
            </>
          )}
        </button>
      </form>
    </div>
  );
}
