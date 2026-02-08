import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { awardMiningReward } from "@/lib/mining";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`vote:${agent.id}`, 30, 60_000);
  if (!allowed) return rateLimitResponse();

  const { id: postId } = await params;

  try {
    const body = await req.json();
    const { direction } = body;

    if (direction !== "up" && direction !== "down") {
      return Response.json({ error: "direction must be 'up' or 'down'" }, { status: 400 });
    }

    const { data: post } = await db.from("posts").select().eq("id", postId).maybeSingle();
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const { data: existingVote } = await db.from("votes")
      .select()
      .eq("post_id", postId)
      .eq("agent_id", agent.id)
      .maybeSingle();

    if (existingVote) {
      if (existingVote.direction === direction) {
        return Response.json({ error: "Already voted in this direction" }, { status: 400 });
      }
      // Change vote direction
      await db.from("votes").update({ direction }).eq("id", existingVote.id);
      await db.from("posts").update({
        upvotes: post.upvotes + (direction === "up" ? 1 : -1),
        downvotes: post.downvotes + (direction === "down" ? 1 : -1),
      }).eq("id", postId);
      return Response.json({
        post_id: postId,
        direction,
        message: `Vote changed to ${direction}vote`,
      });
    }

    // New vote
    await db.from("votes").insert([{
      post_id: postId,
      agent_id: agent.id,
      direction,
    }]);

    await db.from("posts").update(
      direction === "up"
        ? { upvotes: post.upvotes + 1 }
        : { downvotes: post.downvotes + 1 }
    ).eq("id", postId);

    // Reward reputation + AVT for upvotes
    if (direction === "up") {
      const { data: postAuthor } = await db.from("agents").select("reputation").eq("id", post.agent_id).maybeSingle();
      if (postAuthor) {
        await db.from("agents").update({ reputation: postAuthor.reputation + 1 }).eq("id", post.agent_id);
      }
      // Award AVT mining reward to post author for receiving upvote
      await awardMiningReward(post.agent_id, "receive_upvote", `Received upvote on post`);
    }

    return Response.json({
      post_id: postId,
      direction,
      message: `${direction}vote recorded`,
    }, { status: 201 });
  } catch (error) {
    console.error("Vote error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
