/**
 * Campaign business logic — creating, managing, and querying campaigns.
 */

import { db } from "@/lib/insforge";

interface CreateCampaignInput {
  name: string;
  description: string;
  projectUrl?: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  chainId?: number;
  totalAmount: number;
  dailyRelease?: number;
  maxAgents?: number;
  durationDays: number;
  creatorWallet?: string;
  tasks: {
    title: string;
    description: string;
    taskType: string;
    difficulty: string;
    reward: number;
    maxClaims: number;
  }[];
}

/**
 * Create a new campaign with tasks
 */
export async function createCampaign(input: CreateCampaignInput) {
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + input.durationDays);

  const { data: campaignData } = await db.from("campaigns").insert([{
    name: input.name,
    description: input.description,
    creator_wallet: input.creatorWallet || "",
    token_name: input.tokenName,
    token_symbol: input.tokenSymbol,
    token_address: input.tokenAddress,
    chain_id: input.chainId || 84532,
    total_amount: input.totalAmount,
    remaining_amount: input.totalAmount,
    daily_release: input.dailyRelease || Math.floor(input.totalAmount / input.durationDays),
    max_agents: input.maxAgents || 100,
    ends_at: endsAt.toISOString(),
    status: "active",
  }]).select();

  const campaign = campaignData?.[0];
  if (!campaign) return null;

  if (input.tasks.length > 0) {
    await db.from("campaign_tasks").insert(
      input.tasks.map((t) => ({
        campaign_id: campaign.id,
        title: t.title,
        description: t.description,
        task_type: t.taskType,
        difficulty: t.difficulty,
        reward: t.reward,
        max_claims: t.maxClaims,
        status: "open",
        expires_at: endsAt.toISOString(),
      }))
    );
  }

  return campaign;
}

/**
 * Get campaign with stats
 */
export async function getCampaignWithStats(campaignId: string) {
  const { data: campaign } = await db.from("campaigns").select().eq("id", campaignId).maybeSingle();
  if (!campaign) return null;

  const { data: taskIds } = await db.from("campaign_tasks").select("id").eq("campaign_id", campaignId);
  const ids = (taskIds || []).map((t: any) => t.id);

  let totalClaims = 0;
  let approvedClaims = 0;
  let uniqueAgentIds = new Set<string>();

  if (ids.length > 0) {
    const { count: tc } = await db.from("task_claims").select("id", { count: "exact", head: true }).in("task_id", ids);
    totalClaims = tc || 0;
    const { count: ac } = await db.from("task_claims").select("id", { count: "exact", head: true }).in("task_id", ids).eq("status", "approved");
    approvedClaims = ac || 0;
    const { data: claims } = await db.from("task_claims").select("agent_id").in("task_id", ids);
    uniqueAgentIds = new Set((claims || []).map((c: any) => c.agent_id));
  }

  return {
    ...campaign,
    stats: {
      totalClaims,
      approvedClaims,
      uniqueAgents: uniqueAgentIds.size,
      distributed: campaign.total_amount - campaign.remaining_amount,
      distributionPct: campaign.total_amount > 0
        ? ((campaign.total_amount - campaign.remaining_amount) / campaign.total_amount) * 100
        : 0,
    },
  };
}

/**
 * Pause/resume a campaign
 */
export async function toggleCampaignStatus(campaignId: string, status: "active" | "paused") {
  const { data } = await db.from("campaigns").update({ status }).eq("id", campaignId).select();
  return data?.[0];
}
