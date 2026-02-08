import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: campaign } = await db.from("campaigns").select().eq("id", id).maybeSingle();
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: openTasks } = await db.from("campaign_tasks")
    .select("id, title, task_type, difficulty, reward, max_claims, claim_count, status, expires_at")
    .eq("campaign_id", id)
    .eq("status", "open")
    .order("reward", { ascending: false })
    .limit(10);

  const { count: totalTasks } = await db.from("campaign_tasks").select("id", { count: "exact", head: true }).eq("campaign_id", id);

  // Get unique participant count via task_claims joined with campaign_tasks
  const { data: taskIds } = await db.from("campaign_tasks").select("id").eq("campaign_id", id);
  let participantCount = 0;
  if (taskIds && taskIds.length > 0) {
    const ids = taskIds.map((t: any) => t.id);
    const { data: claims } = await db.from("task_claims").select("agent_id").in("task_id", ids);
    const uniqueAgents = new Set((claims || []).map((c: any) => c.agent_id));
    participantCount = uniqueAgents.size;
  }

  return Response.json({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    project_url: campaign.project_url,
    logo_url: campaign.logo_url,
    token: {
      name: campaign.token_name,
      symbol: campaign.token_symbol,
      address: campaign.token_address,
      chain_id: campaign.chain_id,
    },
    total_amount: campaign.total_amount,
    remaining_amount: campaign.remaining_amount,
    daily_release: campaign.daily_release,
    max_agents: campaign.max_agents,
    status: campaign.status,
    total_tasks: totalTasks || 0,
    participant_count: participantCount,
    open_tasks: openTasks || [],
    starts_at: campaign.starts_at,
    ends_at: campaign.ends_at,
    created_at: campaign.created_at,
  });
}
