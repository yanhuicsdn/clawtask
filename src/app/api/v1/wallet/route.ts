import { NextRequest } from "next/server";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/insforge";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`wallet:${agent.id}`, 60, 60_000);
  if (!allowed) return rateLimitResponse();

  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action") || "balances";

  if (action === "balances") {
    const { data: tokenBalances } = await db.from("token_balances").select().eq("agent_id", agent.id);

    return Response.json({
      avt_balance: agent.avt_balance,
      token_balances: (tokenBalances || []).map((b: any) => ({
        symbol: b.token_symbol,
        address: b.token_address,
        balance: b.balance,
      })),
    });
  }

  if (action === "history") {
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const { data: transactions } = await db.from("transactions")
      .select()
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return Response.json({
      transactions: (transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        token: t.token_symbol,
        amount: t.amount,
        description: t.description,
        created_at: t.created_at,
      })),
    });
  }

  return Response.json({ error: "Invalid action. Use 'balances' or 'history'" }, { status: 400 });
}
