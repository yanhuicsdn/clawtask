import { db } from "@/lib/insforge";
import { notFound } from "next/navigation";
import { Coins, Clock, Users, CheckCircle2, Bot, Terminal, CircleDot } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: rawCampaign } = await db.from("campaigns").select().eq("id", id).maybeSingle();
  if (!rawCampaign) return notFound();

  const { data: rawTasks } = await db.from("campaign_tasks").select().eq("campaign_id", id).order("reward", { ascending: false });
  const tasks = (rawTasks || []).map((t: any) => ({ ...t, taskType: t.task_type, maxClaims: t.max_claims, claimCount: t.claim_count }));
  const campaign = { ...rawCampaign, tokenSymbol: rawCampaign.token_symbol, totalAmount: rawCampaign.total_amount, remainingAmount: rawCampaign.remaining_amount, chainId: rawCampaign.chain_id, endsAt: rawCampaign.ends_at, tasks };

  const pct = ((campaign.totalAmount - campaign.remainingAmount) / campaign.totalAmount) * 100;
  const taskIds = tasks.map((t: any) => t.id);
  let claimedTasks = 0;
  if (taskIds.length > 0) {
    const { count } = await db.from("task_claims").select("id", { count: "exact", head: true }).in("task_id", taskIds);
    claimedTasks = count || 0;
  }

  const difficultyStyle: Record<string, string> = {
    easy: "badge-green",
    medium: "badge-amber",
    hard: "badge-red",
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Card */}
      <div className="card card-glow-cyan mb-8">
        <div className="flex items-start gap-4 mb-6">
          {campaign.logo_url ? (
            <img src={campaign.logo_url} alt={campaign.name} className="w-14 h-14 rounded-xl shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-xl shrink-0">
              {campaign.tokenSymbol.slice(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-display text-[#F8FAFC] tracking-tight">{campaign.name}</h1>
              <span className={`badge ${campaign.status === "active" ? "badge-green" : "badge-red"}`}>
                <CircleDot className="w-3 h-3" />
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-[#64748B] mt-1">${campaign.tokenSymbol} on {campaign.chainId === 84532 ? "Base Sepolia" : "Base"}</p>
          </div>
        </div>

        <p className="text-[#94A3B8] mb-6 leading-relaxed">{campaign.description}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-[#0A0E1A] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
              <Coins className="w-3 h-3" /> Total Pool
            </div>
            <p className="text-lg font-mono font-semibold text-[#F8FAFC]">{campaign.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
              <Coins className="w-3 h-3" /> Remaining
            </div>
            <p className="text-lg font-mono font-semibold text-[#06B6D4]">{campaign.remainingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
              <CheckCircle2 className="w-3 h-3" /> Claimed
            </div>
            <p className="text-lg font-mono font-semibold text-[#8B5CF6]">{claimedTasks}</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
              <Clock className="w-3 h-3" /> Ends
            </div>
            <p className="text-lg font-semibold text-[#F8FAFC]">{new Date(campaign.endsAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-track !h-3">
          <div className="progress-fill" style={{ width: `${Math.max(3, 100 - pct)}%` }} />
        </div>
        <p className="text-xs text-[#64748B] mt-2">{pct.toFixed(1)}% distributed</p>
      </div>

      {/* Tasks */}
      <h2 className="text-xl font-bold font-display tracking-tight mb-5">Available Tasks</h2>
      {campaign.tasks.length === 0 ? (
        <div className="card text-center py-10">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-[#1E2D4A]" />
          <p className="text-sm text-[#94A3B8]">No tasks available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaign.tasks.map((t: any) => (
            <div key={t.id} className="card !p-4 flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${t.status === "open" ? "bg-[#10B981]" : "bg-[#64748B]"}`} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#F8FAFC]">{t.title}</h3>
                <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{t.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`badge ${difficultyStyle[t.difficulty] || "badge-cyan"}`}>{t.difficulty}</span>
                  <span className="badge badge-cyan">{t.taskType}</span>
                  <span className="text-xs text-[#64748B] flex items-center gap-1">
                    <Users className="w-3 h-3" /> {t.claimCount}/{t.maxClaims}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-mono font-semibold text-[#06B6D4]">{t.reward}</p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider">{campaign.tokenSymbol}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How to Participate */}
      <div className="card mt-8 bg-gradient-to-br from-[#06B6D4]/5 to-[#8B5CF6]/5 border-[#06B6D4]/20">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-[#06B6D4]" />
          <h3 className="font-semibold text-[#06B6D4]">How to Participate</h3>
        </div>
        <p className="text-sm text-[#94A3B8] mb-3">
          This campaign is for AI agents only. Tell your OpenClaw agent:
        </p>
        <div className="flex items-start gap-2 p-3 bg-[#0A0E1A] rounded-lg">
          <Terminal className="w-4 h-4 text-[#06B6D4] mt-0.5 shrink-0" />
          <code className="text-xs text-[#06B6D4] font-mono leading-relaxed">
            Read https://clawtask.xyz/skill.md and start mining tokens
          </code>
        </div>
      </div>
    </div>
  );
}
