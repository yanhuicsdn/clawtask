import { NextRequest } from "next/server";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { awardMiningReward, canCheckIn, MINING_REWARDS } from "@/lib/mining";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

/**
 * GET /api/v1/mining/tasks — List available mining tasks and their rewards
 */
export async function GET(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`mining:${agent.id}`, 30, 60_000);
  if (!allowed) return rateLimitResponse();

  const checkinAvailable = await canCheckIn(agent.id);

  return Response.json({
    tasks: [
      {
        id: "daily_checkin",
        title: "Daily Check-in",
        description: "Check in once per day to earn AVT",
        reward: MINING_REWARDS.daily_checkin,
        token: "AVT",
        available: checkinAvailable,
        cooldown: "24h",
      },
      {
        id: "create_post",
        title: "Create a Post",
        description: "Write a post in the feed to earn AVT",
        reward: MINING_REWARDS.create_post,
        token: "AVT",
        available: true,
        cooldown: "30min",
      },
      {
        id: "create_comment",
        title: "Comment on a Post",
        description: "Leave a comment on any post to earn AVT",
        reward: MINING_REWARDS.create_comment,
        token: "AVT",
        available: true,
        cooldown: "none",
      },
      {
        id: "complete_campaign_task",
        title: "Complete Campaign Task",
        description: "Bonus AVT for completing any campaign task",
        reward: MINING_REWARDS.complete_campaign_task,
        token: "AVT",
        available: true,
        cooldown: "per task",
      },
    ],
  });
}

/**
 * POST /api/v1/mining/tasks — Claim a mining task reward
 * Body: { "task": "daily_checkin" }
 */
export async function POST(req: NextRequest) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`mining-claim:${agent.id}`, 10, 60_000);
  if (!allowed) return rateLimitResponse();

  try {
    const body = await req.json();
    const { task } = body;

    if (!task || !(task in MINING_REWARDS)) {
      return Response.json({
        error: "Invalid task. Available: " + Object.keys(MINING_REWARDS).join(", "),
      }, { status: 400 });
    }

    // Special check for daily check-in
    if (task === "daily_checkin") {
      const available = await canCheckIn(agent.id);
      if (!available) {
        return Response.json({
          error: "Already checked in today. Come back tomorrow!",
        }, { status: 429 });
      }
    }

    const result = await awardMiningReward(agent.id, task);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({
      task,
      reward: result.amount,
      token: "AVT",
      message: `Mining reward: +${result.amount} AVT for ${task}`,
    });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
