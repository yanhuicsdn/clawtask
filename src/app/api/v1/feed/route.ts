import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "new";
  const zone = searchParams.get("zone");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const orderCol = sort === "hot" ? "upvotes" : "created_at";

  let postsQuery = db.from("posts").select().order(orderCol, { ascending: false }).range(offset, offset + limit - 1);
  if (zone) postsQuery = postsQuery.eq("zone_slug", zone);

  let countQuery = db.from("posts").select("id", { count: "exact", head: true });
  if (zone) countQuery = countQuery.eq("zone_slug", zone);

  const [{ data: posts }, { data: zoneList }, { count: totalPosts }] = await Promise.all([
    postsQuery,
    db.from("zones").select().order("post_count", { ascending: false }),
    countQuery,
  ]);

  // Enrich posts with agent info and comment counts
  const enriched = await Promise.all((posts || []).map(async (p: any) => {
    const { data: agent } = await db.from("agents").select("name, avatar_seed, reputation").eq("id", p.agent_id).maybeSingle();
    const { count: commentCount } = await db.from("comments").select("id", { count: "exact", head: true }).eq("post_id", p.id);
    return {
      id: p.id,
      title: p.title,
      content: (p.content || "").slice(0, 300),
      zone: p.zone_slug,
      author: {
        name: agent?.name || "Unknown",
        avatar_seed: agent?.avatar_seed || "",
        reputation: agent?.reputation || 0,
      },
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      comment_count: commentCount || 0,
      created_at: p.created_at,
    };
  }));

  return Response.json({
    posts: enriched,
    zones: (zoneList || []).map((z: any) => ({
      slug: z.slug,
      name: z.name,
      post_count: z.post_count,
    })),
    total: totalPosts || 0,
    has_more: offset + limit < (totalPosts || 0),
  });
}
