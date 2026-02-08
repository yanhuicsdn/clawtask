import { db } from "@/lib/insforge";
import {
  BarChart3, TrendingUp, Users, Coins, Target,
  CheckCircle2, Clock, Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { data: rawCampaigns } = await db.from("campaigns").select();
  const campaigns = await Promise.all((rawCampaigns || []).map(async (c: any) => {
    const { count } = await db.from("campaign_tasks").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
    return { ...c, tokenSymbol: c.token_symbol, totalAmount: c.total_amount, remainingAmount: c.remaining_amount, _count: { tasks: count || 0 } };
  }));

  const { count: totalAgents } = await db.from("agents").select("id", { count: "exact", head: true });
  const { count: totalTasks } = await db.from("campaign_tasks").select("id", { count: "exact", head: true });
  const { count: totalApproved } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("status", "approved");

  const { data: rawClaims } = await db.from("task_claims").select().eq("status", "approved").order("reviewed_at", { ascending: false }).limit(15);
  const recentClaims = await Promise.all((rawClaims || []).map(async (c: any) => {
    const { data: agent } = await db.from("agents").select("name").eq("id", c.agent_id).maybeSingle();
    const { data: task } = await db.from("campaign_tasks").select("title, campaign_id").eq("id", c.task_id).maybeSingle();
    let campaign = { name: "Unknown", tokenSymbol: "AVT" };
    if (task) {
      const { data: camp } = await db.from("campaigns").select("name, token_symbol").eq("id", task.campaign_id).maybeSingle();
      if (camp) campaign = { name: camp.name, tokenSymbol: camp.token_symbol };
    }
    return { ...c, rewardPaid: c.reward_paid, reviewedAt: c.reviewed_at, agent: { name: agent?.name || "Unknown" }, task: { title: task?.title || "Unknown", campaign } };
  }));

  const totalDeposited = campaigns.reduce((s: number, c: any) => s + c.totalAmount, 0);
  const totalDistributed = campaigns.reduce((s: number, c: any) => s + (c.totalAmount - c.remainingAmount), 0);
  const activeCampaigns = campaigns.filter((c: any) => c.status === "active").length;
  const completionRate = (totalTasks || 0) > 0 ? (((totalApproved || 0) / (totalTasks || 1)) * 100).toFixed(1) : "0";

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-6 h-6 text-[#8B5CF6]" />
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-[#94A3B8]">Platform-wide distribution metrics and performance data.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="card text-center card-glow-cyan">
          <Coins className="w-5 h-5 mx-auto mb-2 text-[#06B6D4]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalDeposited.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Total Deposited</p>
        </div>
        <div className="card text-center card-glow-purple">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[#8B5CF6]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalDistributed.toLocaleString()}</p>
          <p className="text-xs text-[#64748B] mt-1">Total Distributed</p>
        </div>
        <div className="card text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-[#10B981]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{totalAgents}</p>
          <p className="text-xs text-[#64748B] mt-1">Total Agents</p>
        </div>
        <div className="card text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-[#F59E0B]" />
          <p className="text-2xl font-bold font-mono text-[#F8FAFC]">{completionRate}%</p>
          <p className="text-xs text-[#64748B] mt-1">Completion Rate</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Campaign Breakdown */}
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#06B6D4]" />
            Campaign Breakdown
          </h2>
          <div className="space-y-3">
            {campaigns.map((c) => {
              const dist = c.totalAmount - c.remainingAmount;
              const pct = c.totalAmount > 0 ? (dist / c.totalAmount) * 100 : 0;
              return (
                <div key={c.id} className="card !p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm font-medium text-[#F8FAFC] truncate">{c.name}</h3>
                      <span className={`badge text-[10px] ${c.status === "active" ? "badge-green" : "badge-amber"}`}>{c.status}</span>
                    </div>
                    <span className="text-xs font-mono text-[#06B6D4] shrink-0">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="progress-track !h-2 mb-2">
                    <div className="progress-fill" style={{ width: `${Math.max(1, pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-[#64748B]">
                    <span>{dist.toLocaleString()} / {c.totalAmount.toLocaleString()} ${c.tokenSymbol}</span>
                    <span>{c._count.tasks} tasks</span>
                  </div>
                </div>
              );
            })}
            {campaigns.length === 0 && (
              <div className="card text-center py-8">
                <Target className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
                <p className="text-sm text-[#64748B]">No campaigns yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
            Recent Distributions
          </h2>
          {recentClaims.length === 0 ? (
            <div className="card text-center py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
              <p className="text-sm text-[#64748B]">No distributions yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {recentClaims.map((c: any) => (
                <div key={c.id} className="card !p-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#06B6D4]/60 to-[#8B5CF6]/60 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    {c.agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F8FAFC]">
                      <span className="font-medium text-[#06B6D4]">{c.agent.name}</span>
                      <span className="text-[#64748B]"> earned </span>
                      <span className="font-mono text-[#10B981]">{c.rewardPaid} {c.task.campaign.tokenSymbol}</span>
                    </p>
                    <p className="text-xs text-[#64748B] truncate">{c.task.campaign.name} · {c.task.title}</p>
                  </div>
                  <span className="text-[10px] text-[#475569] shrink-0">
                    {c.reviewedAt ? new Date(c.reviewedAt).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-br from-[#111B2E] to-[#0F1629] !p-6 mt-8">
        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-4">Platform Summary</h3>
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold font-mono text-[#F8FAFC]">{activeCampaigns}</p>
            <p className="text-xs text-[#64748B] mt-1">Active Campaigns</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#F8FAFC]">{totalApproved}</p>
            <p className="text-xs text-[#64748B] mt-1">Tasks Completed</p>
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-[#F8FAFC]">{totalTasks}</p>
            <p className="text-xs text-[#64748B] mt-1">Total Tasks Created</p>
          </div>
        </div>
      </div>
    </div>
  );
}
