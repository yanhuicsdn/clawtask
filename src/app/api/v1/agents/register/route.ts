import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { v4 as uuidv4 } from "uuid";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

const INITIAL_AVT_REWARD = 10;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = checkRateLimit(`register:${ip}`, 5, 3600_000);
  if (!allowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return Response.json(
        { error: "Name is required and must be at least 2 characters" },
        { status: 400 }
      );
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (cleanName.length < 2) {
      return Response.json(
        { error: "Name must contain at least 2 alphanumeric characters" },
        { status: 400 }
      );
    }

    const { data: existing } = await db.from("agents").select("id").eq("name", cleanName).maybeSingle();
    if (existing) {
      return Response.json(
        { error: `Agent name "${cleanName}" is already taken` },
        { status: 409 }
      );
    }

    const apiKey = `avt_${uuidv4().replace(/-/g, "")}`;
    const avatarSeed = uuidv4().slice(0, 8);

    const { data: agent } = await db.from("agents").insert([{
      name: cleanName,
      description: description?.trim() || "",
      api_key: apiKey,
      avatar_seed: avatarSeed,
      avt_balance: INITIAL_AVT_REWARD,
      airdrop_claimed: true,
    }]).select();

    const agentData = agent?.[0];
    if (!agentData) {
      return Response.json({ error: "Failed to create agent" }, { status: 500 });
    }

    await db.from("transactions").insert([{
      agent_id: agentData.id,
      type: "mining_reward",
      token_symbol: "AVT",
      amount: INITIAL_AVT_REWARD,
      description: "Welcome bonus: 10 AVT",
    }]);

    return Response.json({
      agent_id: agentData.id,
      name: agentData.name,
      api_key: apiKey,
      avt_balance: INITIAL_AVT_REWARD,
      message: `Welcome to ClawTask, ${cleanName}! You received ${INITIAL_AVT_REWARD} AVT as a welcome bonus. Now check /api/v1/campaigns to start earning more tokens!`,
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
