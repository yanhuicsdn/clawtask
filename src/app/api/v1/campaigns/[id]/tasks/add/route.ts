import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  try {
    const { data: campaign } = await db.from("campaigns").select().eq("id", campaignId).maybeSingle();
    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, task_type, difficulty, reward, max_claims } = body;

    if (!title || !reward) {
      return Response.json({ error: "title and reward are required" }, { status: 400 });
    }

    if (reward <= 0) {
      return Response.json({ error: "reward must be positive" }, { status: 400 });
    }

    const { data: task } = await db.from("campaign_tasks").insert([{
      campaign_id: campaignId,
      title: title.trim(),
      description: (description || "").trim(),
      task_type: task_type || "custom",
      difficulty: difficulty || "medium",
      reward,
      max_claims: max_claims || 1,
      status: "open",
      expires_at: campaign.ends_at,
    }]).select();

    const created = task?.[0];
    if (!created) {
      return Response.json({ error: "Failed to create task" }, { status: 500 });
    }

    return Response.json({
      task_id: created.id,
      campaign_id: campaignId,
      title: created.title,
      reward: created.reward,
      message: `Task "${created.title}" added to campaign "${campaign.name}"`,
    }, { status: 201 });
  } catch (error) {
    console.error("Add task error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
