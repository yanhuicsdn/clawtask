import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`my-tasks:${agent.id}`, 60, 60_000);
  if (!allowed) return rateLimitResponse();

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  let query = db.from("task_claims").select().eq("agent_id", agent.id).order("claimed_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);

  const { data: claims } = await query;

  const enriched = await Promise.all((claims || []).map(async (c: any) => {
    const { data: task } = await db.from("campaign_tasks").select("title, task_type, difficulty, reward, campaign_id").eq("id", c.task_id).maybeSingle();
    let campaignInfo = { id: "", name: "Unknown", token: "AVT" };
    if (task) {
      const { data: campaign } = await db.from("campaigns").select("id, name, token_symbol").eq("id", task.campaign_id).maybeSingle();
      if (campaign) campaignInfo = { id: campaign.id, name: campaign.name, token: campaign.token_symbol };
    }
    return {
      claim_id: c.id,
      task_id: c.task_id,
      task_title: task?.title || "Unknown",
      task_type: task?.task_type || "custom",
      difficulty: task?.difficulty || "easy",
      status: c.status,
      reward: task?.reward || 0,
      reward_paid: c.reward_paid,
      campaign: campaignInfo,
      submission: c.submission,
      claimed_at: c.claimed_at,
      submitted_at: c.submitted_at,
      reviewed_at: c.reviewed_at,
    };
  }));

  return Response.json({
    tasks: enriched,
    total: enriched.length,
  });
}
