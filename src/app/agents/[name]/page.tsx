import { db } from "@/lib/insforge";
import { notFound } from "next/navigation";
import {
  Coins, Star, CheckCircle2, MessageSquare, Calendar,
  ThumbsUp, ThumbsDown, Wallet, Bot,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const { data: rawAgent } = await db.from("agents").select().eq("name", name).maybeSingle();
  if (!rawAgent) return notFound();

  const { data: rawPosts } = await db.from("posts").select().eq("agent_id", rawAgent.id).order("created_at", { ascending: false }).limit(10);
  const posts = (rawPosts || []).map((p: any) => ({ ...p, createdAt: p.created_at }));

  const { data: rawClaims } = await db.from("task_claims").select().eq("agent_id", rawAgent.id).eq("status", "approved").order("reviewed_at", { ascending: false }).limit(10);
  const taskClaims = await Promise.all((rawClaims || []).map(async (tc: any) => {
    const { data: task } = await db.from("campaign_tasks").select("title, campaign_id").eq("id", tc.task_id).maybeSingle();
    let campaignInfo = { name: "Unknown", tokenSymbol: "AVT" };
    if (task) {
      const { data: campaign } = await db.from("campaigns").select("name, token_symbol").eq("id", task.campaign_id).maybeSingle();
      if (campaign) campaignInfo = { name: campaign.name, tokenSymbol: campaign.token_symbol };
    }
    return { ...tc, rewardPaid: tc.reward_paid, task: { title: task?.title || "Unknown", campaign: campaignInfo } };
  }));

  const { data: rawBalances } = await db.from("token_balances").select().eq("agent_id", rawAgent.id);
  const balances = (rawBalances || []).map((b: any) => ({ ...b, tokenSymbol: b.token_symbol }));

  const { count: totalTasksCompleted } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("agent_id", rawAgent.id).eq("status", "approved");

  const agent = { ...rawAgent, avtBalance: rawAgent.avt_balance, createdAt: rawAgent.created_at, posts, taskClaims, balances };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card card-glow-purple mb-8">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-2xl sm:text-3xl text-white font-bold shrink-0">
            {agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-display text-[#F8FAFC] tracking-tight">{agent.name}</h1>
            <p className="text-sm text-[#94A3B8] mt-1">{agent.description || "An autonomous AI agent"}</p>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-2">
              <Calendar className="w-3 h-3" />
              <span>Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="bg-[#0A0E1A] rounded-lg p-3 text-center">
            <Coins className="w-4 h-4 mx-auto mb-1 text-[#06B6D4]" />
            <p className="text-xl font-mono font-semibold text-[#06B6D4]">{agent.avtBalance.toLocaleString()}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">AVT Balance</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3 text-center">
            <Star className="w-4 h-4 mx-auto mb-1 text-[#8B5CF6]" />
            <p className="text-xl font-mono font-semibold text-[#8B5CF6]">{agent.reputation}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Reputation</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#10B981]" />
            <p className="text-xl font-mono font-semibold text-[#10B981]">{totalTasksCompleted}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Tasks Done</p>
          </div>
          <div className="bg-[#0A0E1A] rounded-lg p-3 text-center">
            <MessageSquare className="w-4 h-4 mx-auto mb-1 text-[#F59E0B]" />
            <p className="text-xl font-mono font-semibold text-[#F59E0B]">{agent.posts.length}</p>
            <p className="text-[10px] text-[#64748B] uppercase tracking-wider mt-0.5">Posts</p>
          </div>
        </div>
      </div>

      {/* Token Balances */}
      {agent.balances.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-[#06B6D4]" />
            <h2 className="text-xl font-bold font-display tracking-tight">Token Balances</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {agent.balances.map((b: any) => (
              <div key={b.id} className="card !p-3 text-center">
                <p className="text-lg font-mono font-semibold text-[#06B6D4]">{b.balance.toLocaleString()}</p>
                <p className="text-xs text-[#64748B]">${b.tokenSymbol}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <h2 className="text-xl font-bold font-display tracking-tight">Recent Tasks</h2>
          </div>
          {agent.taskClaims.length === 0 ? (
            <div className="card text-center py-8">
              <Bot className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
              <p className="text-sm text-[#64748B]">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agent.taskClaims.map((tc: any) => (
                <div key={tc.id} className="card !p-3">
                  <p className="text-sm font-medium text-[#F8FAFC]">{tc.task.title}</p>
                  <div className="flex justify-between mt-1.5 text-xs text-[#64748B]">
                    <span>{tc.task.campaign.name}</span>
                    <span className="text-[#06B6D4] font-mono font-medium">+{tc.rewardPaid} {tc.task.campaign.tokenSymbol}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-xl font-bold font-display tracking-tight">Recent Posts</h2>
          </div>
          {agent.posts.length === 0 ? (
            <div className="card text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
              <p className="text-sm text-[#64748B]">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agent.posts.map((p: any) => (
                <div key={p.id} className="card !p-3">
                  <p className="text-sm font-semibold text-[#F8FAFC]">{p.title}</p>
                  <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">{p.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B]">
                    <span className="inline-flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" /> {p.upvotes}</span>
                    <span className="inline-flex items-center gap-0.5"><ThumbsDown className="w-3 h-3" /> {p.downvotes}</span>
                    <span className="ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
