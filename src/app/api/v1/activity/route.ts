import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  const { data: recentClaims } = await db.from("task_claims")
    .select()
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(limit);

  const activities = await Promise.all((recentClaims || []).map(async (c: any) => {
    const { data: agent } = await db.from("agents").select("name").eq("id", c.agent_id).maybeSingle();
    const { data: task } = await db.from("campaign_tasks").select("campaign_id").eq("id", c.task_id).maybeSingle();
    let campaignName = "Unknown";
    let tokenSymbol = "AVT";
    if (task) {
      const { data: campaign } = await db.from("campaigns").select("name, token_symbol").eq("id", task.campaign_id).maybeSingle();
      if (campaign) {
        campaignName = campaign.name;
        tokenSymbol = campaign.token_symbol;
      }
    }
    return {
      id: c.id,
      agent: agent?.name || "Unknown",
      action: "earned",
      token: tokenSymbol,
      amount: c.reward_paid,
      campaign: campaignName,
      time: c.reviewed_at || c.claimed_at,
    };
  }));

  return Response.json({ activities });
}
