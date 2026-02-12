import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`withdraw:${agent.id}`, 5, 3600_000);
  if (!allowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const { token, amount } = body;
    // Use provided 'to' address, or fall back to agent's bound wallet_address
    const to = body.to || agent.wallet_address;

    if (!token || !amount) {
      return Response.json(
        { error: "token (symbol or address) and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return Response.json({ error: "Amount must be positive" }, { status: 400 });
    }

    if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) {
      return Response.json({ error: "No valid wallet address. Provide 'to' or bind a wallet_address via PUT /api/v1/agents/me" }, { status: 400 });
    }

    // Check if withdrawing AVT or project token
    if (token === "AVT" || token === "avt") {
      if (agent.avt_balance < amount) {
        return Response.json({ error: `Insufficient AVT balance. You have ${agent.avt_balance} AVT` }, { status: 400 });
      }

      await db.from("agents").update({ avt_balance: agent.avt_balance - amount }).eq("id", agent.id);
      await db.from("transactions").insert([{
        agent_id: agent.id,
        type: "withdraw",
        token_symbol: "AVT",
        amount: -amount,
        description: `Withdrew ${amount} AVT to ${to}`,
      }]);

      // Execute on-chain AVT transfer
      let txHash: string | undefined;
      try {
        const { sendAvtReward } = await import("@/lib/onChainReward");
        const result = await sendAvtReward(to, amount, `withdraw:${agent.name}`);
        txHash = result.txHash;
      } catch (err) {
        console.error("[withdraw] On-chain transfer failed:", err);
      }

      return Response.json({
        status: txHash ? "completed" : "pending",
        token: "AVT",
        amount,
        to,
        tx_hash: txHash || null,
        chain: "HashKey Chain (177)",
        message: txHash
          ? `Withdrew ${amount} AVT to ${to} on HashKey Chain. TX: ${txHash}`
          : `Withdrawal of ${amount} AVT to ${to} recorded. On-chain transfer will be retried.`,
      });
    }

    // Project token withdrawal — try by symbol first, then by address
    let { data: balance } = await db.from("token_balances")
      .select()
      .eq("agent_id", agent.id)
      .eq("token_symbol", token)
      .maybeSingle();

    if (!balance) {
      const res = await db.from("token_balances")
        .select()
        .eq("agent_id", agent.id)
        .eq("token_address", token)
        .maybeSingle();
      balance = res.data;
    }

    if (!balance || balance.balance < amount) {
      return Response.json(
        { error: `Insufficient ${token} balance. You have ${balance?.balance ?? 0}` },
        { status: 400 }
      );
    }

    await db.from("token_balances").update({ balance: balance.balance - amount }).eq("id", balance.id);
    await db.from("transactions").insert([{
      agent_id: agent.id,
      type: "withdraw",
      token_symbol: balance.token_symbol,
      amount: -amount,
      description: `Withdrew ${amount} ${balance.token_symbol} to ${to}`,
    }]);

    return Response.json({
      status: "pending",
      token: balance.token_symbol,
      amount,
      to,
      message: `Withdrawal of ${amount} ${balance.token_symbol} to ${to} is being processed.`,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
