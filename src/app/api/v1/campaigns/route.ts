import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = checkRateLimit(`campaigns:${ip}`, 60, 60_000);
  if (!allowed) return rateLimitResponse();

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") || "active";
  const sort = searchParams.get("sort") || "newest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const orderCol = sort === "reward_desc" ? "remaining_amount" : "created_at";

  const { data: campaigns } = await db.from("campaigns")
    .select()
    .eq("status", status)
    .order(orderCol, { ascending: false })
    .limit(limit);

  const campaignList = campaigns || [];

  // Get task counts for each campaign
  const result = await Promise.all(campaignList.map(async (c: any) => {
    const { count } = await db.from("campaign_tasks").select("id", { count: "exact", head: true }).eq("campaign_id", c.id);
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      project_url: c.project_url,
      logo_url: c.logo_url,
      token: {
        name: c.token_name,
        symbol: c.token_symbol,
        address: c.token_address,
        chain_id: c.chain_id,
      },
      total_amount: c.total_amount,
      remaining_amount: c.remaining_amount,
      daily_release: c.daily_release,
      max_agents: c.max_agents,
      status: c.status,
      task_count: count || 0,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      created_at: c.created_at,
    };
  }));

  return Response.json({
    campaigns: result,
    total: result.length,
  });
}
