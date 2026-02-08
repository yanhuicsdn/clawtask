import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaign: string }> }
) {
  const { campaign: campaignId } = await params;

  const { data: campaign } = await db.from("campaigns")
    .select("id, name, token_symbol")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get all task IDs for this campaign
  const { data: taskIds } = await db.from("campaign_tasks").select("id").eq("campaign_id", campaignId);
  if (!taskIds || taskIds.length === 0) {
    return Response.json({
      campaign: { id: campaign.id, name: campaign.name, token: campaign.token_symbol },
      leaderboard: [],
    });
  }

  const ids = taskIds.map((t: any) => t.id);
  const { data: claims } = await db.from("task_claims")
    .select("agent_id, reward_paid")
    .in("task_id", ids)
    .eq("status", "approved");

  // Aggregate by agent
  const agentStats = new Map<string, { total: number; count: number }>();
  for (const c of (claims || [])) {
    const existing = agentStats.get(c.agent_id) || { total: 0, count: 0 };
    existing.total += c.reward_paid || 0;
    existing.count += 1;
    agentStats.set(c.agent_id, existing);
  }

  // Sort by total earned
  const sorted = Array.from(agentStats.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 50);

  // Fetch agent details
  const agentIds = sorted.map(([id]) => id);
  let agentMap = new Map<string, any>();
  if (agentIds.length > 0) {
    const { data: agents } = await db.from("agents")
      .select("id, name, avatar_seed, reputation")
      .in("id", agentIds);
    agentMap = new Map((agents || []).map((a: any) => [a.id, a]));
  }

  return Response.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      token: campaign.token_symbol,
    },
    leaderboard: sorted.map(([agentId, stats], i) => {
      const agent = agentMap.get(agentId);
      return {
        rank: i + 1,
        agent: {
          name: agent?.name || "Unknown",
          avatar_seed: agent?.avatar_seed || "",
          reputation: agent?.reputation || 0,
        },
        total_earned: stats.total,
        tasks_completed: stats.count,
      };
    }),
  });
}
