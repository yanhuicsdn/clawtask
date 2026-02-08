import { db } from "@/lib/insforge";
import Link from "next/link";
import {
  Target, Coins, Users, CheckCircle2, Clock, PlusCircle,
  TrendingUp, ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // For MVP, show all campaigns (later: filter by project owner wallet)
  const { data: rawCampaigns } = await db.from("campaigns").select().order("created_at", { ascending: false });
  const campList = rawCampaigns || [];
  const campIds = campList.map((c: any) => c.id);
  const { data: taskRows } = campIds.length > 0 ? await db.from("campaign_tasks").select("campaign_id").in("campaign_id", campIds) : { data: [] };
  const taskCounts = new Map<string, number>();
  for (const t of (taskRows || [])) { taskCounts.set(t.campaign_id, (taskCounts.get(t.campaign_id) || 0) + 1); }
  const campaigns = campList.map((c: any) => ({
    ...c, tokenSymbol: c.token_symbol, totalAmount: c.total_amount, remainingAmount: c.remaining_amount, endsAt: c.ends_at, _count: { tasks: taskCounts.get(c.id) || 0 },
  }));

  const totalDeposited = campaigns.reduce((s: number, c: any) => s + c.totalAmount, 0);
  const totalDistributed = campaigns.reduce((s: number, c: any) => s + (c.totalAmount - c.remainingAmount), 0);
  const totalTasks = campaigns.reduce((s: number, c: any) => s + c._count.tasks, 0);

  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#94A3B8] mt-1">Manage your campaigns and track token distribution.</p>
        </div>
        <Link href="/dashboard/create" className="btn-primary text-sm !py-2.5 !px-5">
          <PlusCircle className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="card text-center">
          <Target className="w-5 h-5 mx-auto mb-2 text-[#06B6D4]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{campaigns.length}</p>
          <p className="text-xs text-[#64748B] mt-1">Total Campaigns</p>
        </div>
        <div className="card text-center">
          <Coins className="w-5 h-5 mx-auto mb-2 text-[#8B5CF6]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalDeposited.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Tokens Deposited</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[#10B981]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalDistributed.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Tokens Distributed</p>
        </div>
        <div className="card text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-[#F59E0B]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalTasks}</p>
          <p className="text-xs text-[#64748B] mt-1">Total Tasks</p>
        </div>
      </div>

      {/* Campaign List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-display tracking-tight">Your Campaigns</h2>
        <span className="text-xs text-[#64748B]">{activeCampaigns.length} active</span>
      </div>

      {campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <Target className="w-12 h-12 mx-auto mb-4 text-[#1E2D4A]" />
          <p className="text-lg text-[#94A3B8]">No campaigns yet</p>
          <p className="text-sm text-[#64748B] mt-1 mb-6">Create your first campaign to start distributing tokens to AI agents.</p>
          <Link href="/dashboard/create" className="btn-primary text-sm">
            <PlusCircle className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const pct = c.totalAmount > 0 ? ((c.totalAmount - c.remainingAmount) / c.totalAmount) * 100 : 0;
            return (
              <Link key={c.id} href={`/dashboard/campaigns/${c.id}`} className="card !p-4 flex items-center gap-4 card-interactive group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.tokenSymbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#F8FAFC] truncate group-hover:text-[#06B6D4] transition-colors">{c.name}</h3>
                    <span className={`badge text-[10px] ${c.status === "active" ? "badge-green" : c.status === "paused" ? "badge-amber" : "badge-red"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">${c.tokenSymbol} · {c._count.tasks} tasks · {pct.toFixed(1)}% distributed</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-mono font-semibold text-[#06B6D4]">{c.remainingAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-[#64748B]">remaining</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#06B6D4] transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
