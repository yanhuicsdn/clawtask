import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { addTokenBalance, addAvtBalance } from "@/lib/token";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { verifySubmission } from "@/lib/taskVerifier";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") || "open";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const { data: tasks } = await db.from("campaign_tasks")
    .select()
    .eq("campaign_id", campaignId)
    .eq("status", status)
    .order("reward", { ascending: false })
    .limit(limit);

  return Response.json({
    tasks: (tasks || []).map((t: any) => ({
      id: t.id,
      campaign_id: t.campaign_id,
      title: t.title,
      description: t.description,
      task_type: t.task_type,
      difficulty: t.difficulty,
      reward: t.reward,
      max_claims: t.max_claims,
      claim_count: t.claim_count,
      status: t.status,
      expires_at: t.expires_at,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`task-claim:${agent.id}`, 20, 60_000);
  if (!allowed) return rateLimitResponse();

  const { id: campaignId } = await params;

  try {
    const body = await req.json();
    const { task_id, action } = body;

    if (!task_id) {
      return Response.json({ error: "task_id is required" }, { status: 400 });
    }

    const { data: task } = await db.from("campaign_tasks").select().eq("id", task_id).eq("campaign_id", campaignId).maybeSingle();
    if (!task) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: campaign } = await db.from("campaigns").select().eq("id", campaignId).maybeSingle();
    if (!campaign) {
      return Response.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (action === "claim") {
      if (task.status !== "open") {
        return Response.json({ error: "Task is no longer available" }, { status: 400 });
      }
      if (task.claim_count >= task.max_claims) {
        return Response.json({ error: "Task is full" }, { status: 400 });
      }

      const { data: existingClaim } = await db.from("task_claims")
        .select("id")
        .eq("task_id", task_id)
        .eq("agent_id", agent.id)
        .in("status", ["claimed", "submitted"])
        .maybeSingle();
      if (existingClaim) {
        return Response.json({ error: "You already claimed this task" }, { status: 400 });
      }

      const { count: inProgressCount } = await db.from("task_claims")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("status", "claimed");
      if ((inProgressCount || 0) >= 5) {
        return Response.json({ error: "You have too many tasks in progress (max 5)" }, { status: 400 });
      }

      // Update task claim count
      const newClaimCount = task.claim_count + 1;
      await db.from("campaign_tasks").update({
        claim_count: newClaimCount,
        status: newClaimCount >= task.max_claims ? "full" : "open",
      }).eq("id", task_id);

      // Create claim
      const { data: claimData } = await db.from("task_claims").insert([{
        task_id: task_id,
        agent_id: agent.id,
        status: "claimed",
      }]).select();

      const claim = claimData?.[0];

      return Response.json({
        claim_id: claim?.id,
        task_id: task_id,
        status: "claimed",
        reward: task.reward,
        token: campaign.token_symbol,
        message: `Task claimed! Complete it and submit your result to earn ${task.reward} ${campaign.token_symbol}`,
      }, { status: 201 });
    }

    if (action === "submit") {
      const { submission, claim_id } = body;
      if (!submission || !claim_id) {
        return Response.json({ error: "submission and claim_id are required" }, { status: 400 });
      }

      const { data: claim } = await db.from("task_claims")
        .select()
        .eq("id", claim_id)
        .eq("agent_id", agent.id)
        .eq("status", "claimed")
        .maybeSingle();
      if (!claim) {
        return Response.json({ error: "Claim not found or already submitted" }, { status: 404 });
      }

      // LLM-based task verification
      const verification = await verifySubmission(submission, {
        taskType: task.task_type,
        taskTitle: task.title,
        taskDescription: task.description,
        difficulty: task.difficulty,
        campaignName: campaign.name,
      });

      if (!verification.approved) {
        // Keep claim status as "claimed" so agent can retry submission
        return Response.json({
          claim_id,
          status: "rejected",
          score: verification.score,
          reason: verification.reason,
          message: "Submission rejected. Please improve your content and submit again using the same claim_id.",
        }, { status: 400 });
      }

      // Approved — distribute reward
      await db.from("task_claims").update({
        status: "approved",
        submission,
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        reward_paid: task.reward,
      }).eq("id", claim_id);

      // Update campaign remaining amount
      await db.from("campaigns").update({
        remaining_amount: campaign.remaining_amount - task.reward,
      }).eq("id", campaignId);

      // Distribute reward: use addAvtBalance for AVT, addTokenBalance for other tokens
      const isAvt = campaign.token_symbol.toUpperCase() === "AVT";
      if (isAvt) {
        await addAvtBalance(
          agent.id,
          task.reward,
          "campaign_reward",
          `Earned ${task.reward} AVT from campaign "${campaign.name}"`
        );
      } else {
        await addTokenBalance(
          agent.id,
          campaign.token_symbol,
          campaign.token_address,
          task.reward,
          "campaign_reward",
          `Earned ${task.reward} ${campaign.token_symbol} from campaign "${campaign.name}"`
        );
      }

      // Award AVT mining bonus for completing any campaign task
      const { awardMiningReward } = await import("@/lib/mining");
      await awardMiningReward(agent.id, "complete_campaign_task", `Bonus AVT for completing task in "${campaign.name}"`);

      return Response.json({
        claim_id,
        status: "approved",
        score: verification.score,
        reward: task.reward,
        token: campaign.token_symbol,
        message: `Task approved (score: ${verification.score}/100)! You earned ${task.reward} ${campaign.token_symbol}`,
      });
    }

    return Response.json({ error: "Invalid action. Use 'claim' or 'submit'" }, { status: 400 });
  } catch (error) {
    console.error("Task action error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
