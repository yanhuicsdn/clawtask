import { db } from "@/lib/insforge";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Coins, Users, CheckCircle2, Clock, ListChecks,
  Pause, Play, XCircle, TrendingUp, Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: rawCampaign } = await db.from("campaigns").select().eq("id", id).maybeSingle();
  if (!rawCampaign) return notFound();

  const { data: rawTasks } = await db.from("campaign_tasks").select().eq("campaign_id", id).order("reward", { ascending: false });
  const tasks = await Promise.all((rawTasks || []).map(async (t: any) => {
    const { count } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("task_id", t.id);
    return { ...t, taskType: t.task_type, maxClaims: t.max_claims, claimCount: t.claim_count, _count: { claims: count || 0 } };
  }));

  const campaign: any = { ...rawCampaign, tokenSymbol: rawCampaign.token_symbol, totalAmount: rawCampaign.total_amount, remainingAmount: rawCampaign.remaining_amount, endsAt: rawCampaign.ends_at, tasks };

  const taskIds = tasks.map((t: any) => t.id);
  let totalClaims = 0;
  let approvedClaims = 0;
  let uniqueAgentCount = 0;

  if (taskIds.length > 0) {
    const { count: tc } = await db.from("task_claims").select("id", { count: "exact", head: true }).in("task_id", taskIds);
    totalClaims = tc || 0;
    const { count: ac } = await db.from("task_claims").select("id", { count: "exact", head: true }).in("task_id", taskIds).eq("status", "approved");
    approvedClaims = ac || 0;
    const { data: allClaims } = await db.from("task_claims").select("agent_id").in("task_id", taskIds);
    uniqueAgentCount = new Set((allClaims || []).map((c: any) => c.agent_id)).size;
  }

  const distributed = campaign.totalAmount - campaign.remainingAmount;
  const pct = campaign.totalAmount > 0 ? (distributed / campaign.totalAmount) * 100 : 0;

  // Top agents aggregation
  let topAgents: any[] = [];
  let agentMap = new Map<string, any>();
  if (taskIds.length > 0) {
    const { data: approvedClaimsData } = await db.from("task_claims").select("agent_id, reward_paid").in("task_id", taskIds).eq("status", "approved");
    const agentStats = new Map<string, { total: number; count: number }>();
    for (const c of (approvedClaimsData || [])) {
      const existing = agentStats.get(c.agent_id) || { total: 0, count: 0 };
      existing.total += c.reward_paid || 0;
      existing.count += 1;
      agentStats.set(c.agent_id, existing);
    }
    topAgents = Array.from(agentStats.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 10).map(([agentId, stats]) => ({ agentId, _sum: { rewardPaid: stats.total }, _count: stats.count }));

    const agentIds = topAgents.map((a: any) => a.agentId);
    if (agentIds.length > 0) {
      const { data: agents } = await db.from("agents").select("id, name").in("id", agentIds);
      agentMap = new Map((agents || []).map((a: any) => [a.id, a]));
    }
  }

  return (
    <div>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#06B6D4] transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shrink-0">
          {campaign.tokenSymbol.slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-display tracking-tight">{campaign.name}</h1>
            <span className={`badge ${campaign.status === "active" ? "badge-green" : campaign.status === "paused" ? "badge-amber" : "badge-red"}`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-sm text-[#94A3B8]">{campaign.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="card text-center">
          <Coins className="w-4 h-4 mx-auto mb-1.5 text-[#06B6D4]" />
          <p className="text-xl font-bold font-mono text-[#F8FAFC]">{distributed.toLocaleString()}</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Distributed</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-4 h-4 mx-auto mb-1.5 text-[#8B5CF6]" />
          <p className="text-xl font-bold font-mono text-[#F8FAFC]">{campaign.remainingAmount.toLocaleString()}</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Remaining</p>
        </div>
        <div className="card text-center">
          <Users className="w-4 h-4 mx-auto mb-1.5 text-[#10B981]" />
          <p className="text-xl font-bold font-mono text-[#F8FAFC]">{uniqueAgentCount}</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Participants</p>
        </div>
        <div className="card text-center">
          <CheckCircle2 className="w-4 h-4 mx-auto mb-1.5 text-[#F59E0B]" />
          <p className="text-xl font-bold font-mono text-[#F8FAFC]">{approvedClaims}/{totalClaims}</p>
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Approved/Total</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#94A3B8]">Distribution Progress</h2>
          <span className="text-sm font-mono text-[#06B6D4]">{pct.toFixed(1)}%</span>
        </div>
        <div className="progress-track !h-3">
          <div className="progress-fill" style={{ width: `${Math.max(1, pct)}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-[#64748B]">
          <span>{distributed.toLocaleString()} / {campaign.totalAmount.toLocaleString()} {campaign.tokenSymbol}</span>
          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Ends {new Date(campaign.endsAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-5 h-5 text-[#06B6D4]" />
            <h2 className="text-lg font-bold font-display tracking-tight">Tasks ({campaign.tasks.length})</h2>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {campaign.tasks.map((t: any) => (
              <div key={t.id} className="card !p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#F8FAFC] truncate">{t.title}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {t.taskType} · {t.difficulty} · {t._count.claims}/{t.maxClaims} claims
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-mono text-[#06B6D4]">{t.reward}</p>
                    <span className={`badge text-[10px] ${t.status === "open" ? "badge-green" : t.status === "full" ? "badge-amber" : "badge-red"}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Agents */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="text-lg font-bold font-display tracking-tight">Top Earners</h2>
          </div>
          {topAgents.length === 0 ? (
            <div className="card text-center py-10">
              <Bot className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
              <p className="text-sm text-[#64748B]">No agents have earned rewards yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topAgents.map((a: any, i: number) => {
                const agent = agentMap.get(a.agentId);
                return (
                  <div key={a.agentId} className="card !p-3 flex items-center gap-3">
                    <span className="text-sm font-bold w-5 text-center shrink-0" style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#64748B' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F8FAFC] truncate">{agent?.name || "Unknown"}</p>
                      <p className="text-xs text-[#64748B]">{a._count} tasks completed</p>
                    </div>
                    <p className="text-sm font-mono font-semibold text-[#06B6D4] shrink-0">
                      {(a._sum.rewardPaid || 0).toLocaleString()} {campaign.tokenSymbol}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
