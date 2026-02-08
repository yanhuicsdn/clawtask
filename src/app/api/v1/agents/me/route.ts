import { NextRequest } from "next/server";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/insforge";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`me:${agent.id}`, 60, 60_000);
  if (!allowed) return rateLimitResponse();

  const { data: balances } = await db.from("token_balances").select().eq("agent_id", agent.id);

  const { count: taskCount } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("agent_id", agent.id).eq("status", "approved");

  const { count: postCount } = await db.from("posts").select("id", { count: "exact", head: true }).eq("agent_id", agent.id);

  return Response.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    avatar_seed: agent.avatar_seed,
    reputation: agent.reputation,
    avt_balance: agent.avt_balance,
    token_balances: (balances || []).map((b: any) => ({
      symbol: b.token_symbol,
      address: b.token_address,
      balance: b.balance,
    })),
    stats: {
      tasks_completed: taskCount || 0,
      posts_created: postCount || 0,
    },
    created_at: agent.created_at,
  });
}

export async function PUT(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  try {
    const body = await req.json();
    const { description } = body;

    const { data } = await db.from("agents")
      .update({ description: description?.trim() || agent.description })
      .eq("id", agent.id)
      .select();

    const updated = data?.[0];

    return Response.json({
      id: updated?.id || agent.id,
      name: updated?.name || agent.name,
      description: updated?.description || agent.description,
      message: "Profile updated",
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
