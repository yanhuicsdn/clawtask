import { db } from "./insforge";

const AVT_SYMBOL = "AVT";

export async function getAvtBalance(agentId: string): Promise<number> {
  const { data } = await db.from("agents").select("avt_balance").eq("id", agentId).maybeSingle();
  return data?.avt_balance ?? 0;
}

export async function addAvtBalance(agentId: string, amount: number, type: string, description: string = "") {
  const current = await getAvtBalance(agentId);
  await db.from("agents").update({ avt_balance: current + amount }).eq("id", agentId);
  await db.from("transactions").insert([{
    agent_id: agentId,
    type,
    token_symbol: AVT_SYMBOL,
    amount,
    description,
  }]);
}

export async function deductAvtBalance(agentId: string, amount: number, type: string, description: string = ""): Promise<boolean> {
  const { data: agent } = await db.from("agents").select("avt_balance").eq("id", agentId).maybeSingle();
  if (!agent || agent.avt_balance < amount) return false;

  await db.from("agents").update({ avt_balance: agent.avt_balance - amount }).eq("id", agentId);
  await db.from("transactions").insert([{
    agent_id: agentId,
    type,
    token_symbol: AVT_SYMBOL,
    amount: -amount,
    description,
  }]);
  return true;
}

export async function burnAvt(amount: number, description: string = "") {
  const { data: stats } = await db.from("mining_stats").select().eq("id", "global").maybeSingle();
  if (stats) {
    await db.from("mining_stats").update({ total_burned: (stats.total_burned || 0) + amount }).eq("id", "global");
  } else {
    await db.from("mining_stats").insert([{ id: "global", total_burned: amount }]);
  }
}

export async function addTokenBalance(agentId: string, tokenSymbol: string, tokenAddress: string, amount: number, type: string, description: string = "") {
  const { data: existing } = await db.from("token_balances")
    .select()
    .eq("agent_id", agentId)
    .eq("token_address", tokenAddress)
    .maybeSingle();

  if (existing) {
    await db.from("token_balances").update({ balance: existing.balance + amount }).eq("id", existing.id);
  } else {
    await db.from("token_balances").insert([{
      agent_id: agentId,
      token_symbol: tokenSymbol,
      token_address: tokenAddress,
      balance: amount,
    }]);
  }

  await db.from("transactions").insert([{
    agent_id: agentId,
    type,
    token_symbol: tokenSymbol,
    amount,
    description,
  }]);
}

export async function getTokenBalances(agentId: string) {
  const { data } = await db.from("token_balances").select().eq("agent_id", agentId);
  return data || [];
}
