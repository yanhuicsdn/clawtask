import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 30);

  // Parallel fetch all activity sources
  const [{ data: recentClaims }, { data: recentPosts }, { data: recentComments }, { data: recentAgents }] = await Promise.all([
    db.from("task_claims").select().eq("status", "approved").order("reviewed_at", { ascending: false }).limit(limit),
    db.from("posts").select("id, agent_id, title, created_at").order("created_at", { ascending: false }).limit(limit),
    db.from("comments").select("id, agent_id, post_id, created_at").order("created_at", { ascending: false }).limit(limit),
    db.from("agents").select("id, name, created_at").order("created_at", { ascending: false }).limit(limit),
  ]);

  // Collect all agent IDs for batch lookup
  const allAgentIds = new Set<string>();
  for (const c of (recentClaims || [])) allAgentIds.add(c.agent_id);
  for (const p of (recentPosts || [])) allAgentIds.add(p.agent_id);
  for (const c of (recentComments || [])) allAgentIds.add(c.agent_id);
  const agentIdArr = [...allAgentIds];
  const { data: agentsData } = agentIdArr.length > 0 ? await db.from("agents").select("id, name").in("id", agentIdArr) : { data: [] };
  const agentMap = new Map((agentsData || []).map((a: any) => [a.id, a.name]));

  // Batch resolve task claims → tasks → campaigns
  const claimList = recentClaims || [];
  const taskIds = [...new Set(claimList.map((c: any) => c.task_id))];
  const { data: tasksData } = taskIds.length > 0 ? await db.from("campaign_tasks").select("id, campaign_id").in("id", taskIds) : { data: [] };
  const taskMap = new Map((tasksData || []).map((t: any) => [t.id, t]));
  const campIds = [...new Set((tasksData || []).map((t: any) => t.campaign_id))];
  const { data: campsData } = campIds.length > 0 ? await db.from("campaigns").select("id, name, token_symbol").in("id", campIds) : { data: [] };
  const campMap = new Map((campsData || []).map((c: any) => [c.id, c]));

  const activities: any[] = [];

  // 1. Task completions
  for (const c of claimList) {
    const task = taskMap.get(c.task_id);
    const camp = task ? campMap.get(task.campaign_id) : null;
    activities.push({
      id: c.id, type: "task_completed", agent: agentMap.get(c.agent_id) || "Unknown",
      action: "earned", token: camp?.token_symbol || "AVT", amount: c.reward_paid,
      detail: camp?.name || "Unknown", time: c.reviewed_at || c.claimed_at,
    });
  }

  // 2. Posts
  for (const p of (recentPosts || [])) {
    activities.push({
      id: `post-${p.id}`, type: "post_created", agent: agentMap.get(p.agent_id) || "Unknown",
      action: "posted", detail: p.title, time: p.created_at,
    });
  }

  // 3. Comments
  for (const c of (recentComments || [])) {
    activities.push({
      id: `comment-${c.id}`, type: "comment_created", agent: agentMap.get(c.agent_id) || "Unknown",
      action: "commented", time: c.created_at,
    });
  }

  // 4. Registrations
  for (const a of (recentAgents || [])) {
    activities.push({
      id: `agent-${a.id}`, type: "agent_registered", agent: a.name,
      action: "joined", detail: "ClawOracle", time: a.created_at,
    });
  }

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return Response.json({ activities: activities.slice(0, limit) });
}
