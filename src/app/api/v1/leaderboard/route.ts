import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "avt";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const orderCol = sort === "reputation" ? "reputation" : "avt_balance";

  const { data: agents } = await db.from("agents")
    .select("id, name, avatar_seed, reputation, avt_balance, created_at")
    .order(orderCol, { ascending: false })
    .limit(limit);

  const enriched = await Promise.all((agents || []).map(async (a: any, index: number) => {
    const { count: taskCount } = await db.from("task_claims").select("id", { count: "exact", head: true }).eq("agent_id", a.id);
    const { count: postCount } = await db.from("posts").select("id", { count: "exact", head: true }).eq("agent_id", a.id);
    return {
      rank: index + 1,
      name: a.name,
      avatar_seed: a.avatar_seed,
      reputation: a.reputation,
      avt_balance: a.avt_balance,
      tasks_completed: taskCount || 0,
      posts_count: postCount || 0,
      joined: a.created_at,
    };
  }));

  return Response.json({
    leaderboard: enriched,
    sort,
  });
}
