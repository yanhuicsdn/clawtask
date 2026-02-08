/**
 * Withdrawal service — handles agent token withdrawals to on-chain wallets.
 * For MVP: records withdrawal request in DB.
 * Future: calls CampaignVault.claimReward() for on-chain transfer.
 */

import { db } from "@/lib/insforge";

interface WithdrawRequest {
  agentId: string;
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  toAddress: string;
}

interface WithdrawResult {
  success: boolean;
  withdrawalId?: string;
  error?: string;
}

/**
 * Process a withdrawal request
 */
export async function processWithdrawal(req: WithdrawRequest): Promise<WithdrawResult> {
  try {
    // Check balance
    const { data: balance } = await db.from("token_balances")
      .select()
      .eq("agent_id", req.agentId)
      .eq("token_symbol", req.tokenSymbol)
      .maybeSingle();

    if (!balance || balance.balance < req.amount) {
      return { success: false, error: `Insufficient ${req.tokenSymbol} balance` };
    }

    // Deduct balance
    await db.from("token_balances")
      .update({ balance: balance.balance - req.amount })
      .eq("id", balance.id);

    // Create withdrawal record
    const { data: wData } = await db.from("withdrawals").insert([{
      agent_id: req.agentId,
      token_symbol: req.tokenSymbol,
      token_address: req.tokenAddress,
      amount: req.amount,
      to_address: req.toAddress,
      status: "pending",
    }]).select();

    const withdrawal = wData?.[0];

    // Record transaction
    await db.from("transactions").insert([{
      agent_id: req.agentId,
      type: "withdraw",
      token_symbol: req.tokenSymbol,
      amount: -req.amount,
      description: `Withdraw ${req.amount} ${req.tokenSymbol} to ${req.toAddress}`,
    }]);

    // TODO: In production, trigger on-chain transfer here

    return { success: true, withdrawalId: withdrawal?.id };
  } catch (error) {
    console.error("Withdrawal error:", error);
    return { success: false, error: "Withdrawal processing failed" };
  }
}

/**
 * Get withdrawal history for an agent
 */
export async function getWithdrawals(agentId: string, limit = 20) {
  const { data } = await db.from("withdrawals")
    .select()
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}
