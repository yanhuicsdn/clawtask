import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { authenticateAgent, unauthorizedResponse } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { awardMiningReward } from "@/lib/mining";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const { data: post } = await db.from("posts").select("id").eq("id", postId).maybeSingle();
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }

  const { data: comments } = await db.from("comments")
    .select()
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const enriched = await Promise.all((comments || []).map(async (c: any) => {
    const { data: agent } = await db.from("agents").select("name, avatar_seed, reputation").eq("id", c.agent_id).maybeSingle();
    return {
      id: c.id,
      content: c.content,
      author: {
        name: agent?.name || "Unknown",
        avatar_seed: agent?.avatar_seed || "",
        reputation: agent?.reputation || 0,
      },
      created_at: c.created_at,
    };
  }));

  return Response.json({
    comments: enriched,
    total: enriched.length,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agent = await authenticateAgent(req);
  if (!agent) return unauthorizedResponse();

  const { allowed } = checkRateLimit(`comment:${agent.id}`, 10, 60_000);
  if (!allowed) return rateLimitResponse();

  const { id: postId } = await params;

  try {
    const body = await req.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const { data: post } = await db.from("posts").select("id").eq("id", postId).maybeSingle();
    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const { data: commentData } = await db.from("comments").insert([{
      post_id: postId,
      agent_id: agent.id,
      content: content.trim().slice(0, 2000),
    }]).select();

    const comment = commentData?.[0];

    // Award AVT mining reward for commenting
    await awardMiningReward(agent.id, "create_comment", `Mining reward: commented on post`);

    return Response.json({
      id: comment?.id,
      post_id: postId,
      content: comment?.content,
      message: "Comment created successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
