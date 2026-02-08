import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { getSessionOwner } from "@/lib/ownerAuth";

const PLATFORM_FEE_RATE = 0.05; // 5%

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      project_url,
      token_name,
      token_symbol,
      token_address,
      chain_id,
      total_amount,
      daily_release,
      max_agents,
      duration_days,
      creator_wallet,
      tasks,
    } = body;

    if (!name || !token_name || !token_symbol || !token_address || !total_amount) {
      return Response.json({
        error: "Missing required fields: name, token_name, token_symbol, token_address, total_amount",
      }, { status: 400 });
    }

    if (total_amount <= 0) {
      return Response.json({ error: "total_amount must be positive" }, { status: 400 });
    }

    const platformFee = total_amount * PLATFORM_FEE_RATE;
    const netAmount = total_amount - platformFee;
    const days = duration_days || 30;
    const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { data: campaignData } = await db.from("campaigns").insert([{
      name: name.trim(),
      description: (description || "").trim(),
      project_url: project_url || "",
      logo_url: "",
      token_name: token_name.trim(),
      token_symbol: token_symbol.trim().toUpperCase(),
      token_address: token_address.trim(),
      chain_id: chain_id || 84532,
      total_amount: netAmount,
      remaining_amount: netAmount,
      platform_fee: platformFee,
      daily_release: daily_release || netAmount / days,
      max_agents: max_agents || 0,
      status: "active",
      creator_wallet: (creator_wallet || "").trim(),
      owner_id: (await getSessionOwner())?.id || "",
      ends_at: endsAt,
    }]).select();

    const campaign = campaignData?.[0];
    if (!campaign) {
      return Response.json({ error: "Failed to create campaign" }, { status: 500 });
    }

    // Create tasks if provided
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      await db.from("campaign_tasks").insert(
        tasks.map((t: any) => ({
          campaign_id: campaign.id,
          title: t.title || "Untitled Task",
          description: t.description || "",
          task_type: t.task_type || "custom",
          difficulty: t.difficulty || "easy",
          reward: t.reward || 10,
          max_claims: t.max_claims || 100,
          expires_at: endsAt,
        }))
      );
    }

    return Response.json({
      campaign_id: campaign.id,
      name: campaign.name,
      token_symbol: campaign.token_symbol,
      total_deposited: total_amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      fee_rate: `${PLATFORM_FEE_RATE * 100}%`,
      ends_at: campaign.ends_at,
      tasks_created: tasks?.length || 0,
      message: `Campaign created! ${platformFee.toLocaleString()} ${campaign.token_symbol} platform fee deducted. ${netAmount.toLocaleString()} ${campaign.token_symbol} available for agents.`,
    }, { status: 201 });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
