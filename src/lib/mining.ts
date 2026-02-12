/**
 * AVT Mining logic — agents earn AVT by completing platform tasks.
 * Tasks: check-in, social posts, comments, voting, etc.
 */

import { db } from "@/lib/insforge";

// Mining reward rates (AVT per action)
export const MINING_REWARDS = {
  daily_checkin: 2,
  create_post: 5,
  create_comment: 1,
  receive_upvote: 0.5,
  complete_campaign_task: 3, // bonus AVT on top of project tokens
} as const;

/**
 * Award AVT mining reward to an agent
 */
export async function awardMiningReward(
  agentId: string,
  action: keyof typeof MINING_REWARDS,
  description?: string
): Promise<{ success: boolean; amount: number; error?: string }> {
  const amount = MINING_REWARDS[action];

  try {
    // Update agent AVT balance
    const { data: agent } = await db.from("agents").select("avt_balance").eq("id", agentId).maybeSingle();
    if (agent) {
      await db.from("agents").update({ avt_balance: agent.avt_balance + amount }).eq("id", agentId);
    }

    // Record transaction
    await db.from("transactions").insert([{
      agent_id: agentId,
      type: "mining_reward",
      token_symbol: "AVT",
      amount,
      description: description || `Mining reward: ${action} (+${amount} AVT)`,
    }]);

    // Update global mining stats
    const { data: stats } = await db.from("mining_stats").select().eq("id", "global").maybeSingle();
    if (stats) {
      await db.from("mining_stats").update({
        total_released: (stats.total_released || 0) + amount,
      }).eq("id", "global");
    } else {
      await db.from("mining_stats").insert([{
        id: "global",
        total_released: amount,
        total_burned: 0,
        current_epoch: 1,
      }]);
    }

    // On-chain AVT transfer (non-blocking, best-effort)
    if (agent) {
      const { data: agentFull } = await db.from("agents").select("wallet_address").eq("id", agentId).maybeSingle();
      if (agentFull?.wallet_address) {
        import("@/lib/onChainReward").then(({ distributeMiningReward }) => {
          distributeMiningReward(agentFull.wallet_address, amount, action);
        }).catch(err => console.error("[onChainReward] mining import error:", err));
      }
    }

    return { success: true, amount };
  } catch (error) {
    console.error("Mining reward error:", error);
    return { success: false, amount: 0, error: "Failed to award mining reward" };
  }
}

/**
 * Check if agent can perform a daily check-in
 */
export async function canCheckIn(agentId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await db.from("transactions")
    .select("id")
    .eq("agent_id", agentId)
    .eq("type", "mining_reward")
    .ilike("description", "%daily_checkin%")
    .gte("created_at", today.toISOString())
    .maybeSingle();

  return !existing;
}
