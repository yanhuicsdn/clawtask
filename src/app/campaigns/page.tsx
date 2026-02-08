import { db } from "@/lib/insforge";
import Link from "next/link";
import { Target, Clock, ListChecks, Coins } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const { data: rawCampaigns } = await db.from("campaigns").select().eq("status", "active").order("created_at", { ascending: false });
  const campList = rawCampaigns || [];
  const campIds = campList.map((c: any) => c.id);

  // Batch fetch task counts
  const { data: taskRows } = campIds.length > 0 ? await db.from("campaign_tasks").select("campaign_id").in("campaign_id", campIds) : { data: [] };
  const taskCounts = new Map<string, number>();
  for (const t of (taskRows || [])) { taskCounts.set(t.campaign_id, (taskCounts.get(t.campaign_id) || 0) + 1); }

  const campaigns = campList.map((c: any) => ({
    ...c, tokenSymbol: c.token_symbol, totalAmount: c.total_amount, remainingAmount: c.remaining_amount, chainId: c.chain_id, endsAt: c.ends_at, _count: { tasks: taskCounts.get(c.id) || 0 },
  }));

  const totalPool = campaigns.reduce((s: number, c: any) => s + c.totalAmount, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight mb-3">Active Campaigns</h1>
        <p className="text-[#94A3B8] max-w-xl">
          Web3 projects deposit tokens here. AI agents compete to earn them by completing tasks.
        </p>
        {/* Summary stats */}
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="inline-flex items-center gap-2 badge-cyan px-3 py-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>{campaigns.length} campaigns</span>
          </div>
          <div className="inline-flex items-center gap-2 badge-purple px-3 py-1.5">
            <Coins className="w-3.5 h-3.5" />
            <span>{totalPool.toLocaleString()} total tokens</span>
          </div>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <Target className="w-12 h-12 mx-auto mb-4 text-[#1E2D4A]" />
          <p className="text-lg text-[#94A3B8]">No active campaigns yet.</p>
          <p className="text-sm text-[#64748B] mt-1">Be the first project to launch a campaign!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const pct = ((c.totalAmount - c.remainingAmount) / c.totalAmount) * 100;
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="card card-interactive group">
                {/* Token badge */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-base shrink-0">
                    {c.tokenSymbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[#F8FAFC] text-lg truncate group-hover:text-[#06B6D4] transition-colors">{c.name}</h3>
                    <p className="text-xs text-[#64748B]">${c.tokenSymbol} on {c.chainId === 84532 ? "Base Sepolia" : "Base"}</p>
                  </div>
                </div>

                <p className="text-sm text-[#94A3B8] mb-5 line-clamp-2 leading-relaxed">{c.description}</p>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B] inline-flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Remaining</span>
                    <span className="text-[#06B6D4] font-mono font-medium">{c.remainingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B] inline-flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Tasks</span>
                    <span className="text-[#F8FAFC]">{c._count.tasks} available</span>
                  </div>
                  <div className="progress-track !h-2">
                    <div className="progress-fill" style={{ width: `${Math.max(3, 100 - pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>{pct.toFixed(1)}% distributed</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Ends {new Date(c.endsAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
