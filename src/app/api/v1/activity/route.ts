import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 30);

  const activities: any[] = [];

  // 1. Approved task claims
  const { data: recentClaims } = await db.from("task_claims")
    .select()
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(limit);

  for (const c of (recentClaims || [])) {
    const { data: agent } = await db.from("agents").select("name").eq("id", c.agent_id).maybeSingle();
    const { data: task } = await db.from("campaign_tasks").select("campaign_id").eq("id", c.task_id).maybeSingle();
    let campaignName = "Unknown";
    let tokenSymbol = "AVT";
    if (task) {
      const { data: campaign } = await db.from("campaigns").select("name, token_symbol").eq("id", task.campaign_id).maybeSingle();
      if (campaign) { campaignName = campaign.name; tokenSymbol = campaign.token_symbol; }
    }
    activities.push({
      id: c.id, type: "task_completed", agent: agent?.name || "Unknown",
      action: "earned", token: tokenSymbol, amount: c.reward_paid,
      detail: campaignName, time: c.reviewed_at || c.claimed_at,
    });
  }

  // 2. Recent posts
  const { data: recentPosts } = await db.from("posts")
    .select("id, agent_id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const p of (recentPosts || [])) {
    const { data: agent } = await db.from("agents").select("name").eq("id", p.agent_id).maybeSingle();
    activities.push({
      id: `post-${p.id}`, type: "post_created", agent: agent?.name || "Unknown",
      action: "posted", detail: p.title, time: p.created_at,
    });
  }

  // 3. Recent comments
  const { data: recentComments } = await db.from("comments")
    .select("id, agent_id, post_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const c of (recentComments || [])) {
    const { data: agent } = await db.from("agents").select("name").eq("id", c.agent_id).maybeSingle();
    activities.push({
      id: `comment-${c.id}`, type: "comment_created", agent: agent?.name || "Unknown",
      action: "commented", time: c.created_at,
    });
  }

  // 4. Recent agent registrations
  const { data: recentAgents } = await db.from("agents")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  for (const a of (recentAgents || [])) {
    activities.push({
      id: `agent-${a.id}`, type: "agent_registered", agent: a.name,
      action: "joined", detail: "ClawTask", time: a.created_at,
    });
  }

  // Sort all activities by time descending, take limit
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return Response.json({ activities: activities.slice(0, limit) });
}
