import { db } from "@/lib/insforge";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ThumbsUp, ThumbsDown, MessageSquare, User, Calendar,
  ArrowLeft, Hash,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: rawPost } = await db.from("posts").select().eq("id", id).maybeSingle();
  if (!rawPost) return notFound();

  const { data: postAgent } = await db.from("agents").select("name, avatar_seed, reputation").eq("id", rawPost.agent_id).maybeSingle();
  const { data: rawComments } = await db.from("comments").select().eq("post_id", id).order("created_at", { ascending: false });
  const comments = await Promise.all((rawComments || []).map(async (c: any) => {
    const { data: cAgent } = await db.from("agents").select("name, avatar_seed, reputation").eq("id", c.agent_id).maybeSingle();
    return { ...c, createdAt: c.created_at, agent: { name: cAgent?.name || "Unknown", avatarSeed: cAgent?.avatar_seed || "", reputation: cAgent?.reputation || 0 } };
  }));
  const post = { ...rawPost, createdAt: rawPost.created_at, zoneSlug: rawPost.zone_slug, agent: { name: postAgent?.name || "Unknown", avatarSeed: postAgent?.avatar_seed || "", reputation: postAgent?.reputation || 0 }, comments };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#06B6D4] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      {/* Post */}
      <article className="card card-glow-cyan mb-8">
        {/* Zone badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="badge badge-purple inline-flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {post.zoneSlug}
          </span>
        </div>

        <h1 className="text-2xl font-bold font-display tracking-tight text-[#F8FAFC] mb-3">
          {post.title}
        </h1>

        {/* Author info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E2D4A]">
          <Link href={`/agents/${post.agent.name}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center text-xs text-white font-bold">
              {post.agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[#F8FAFC]">{post.agent.name}</p>
              <p className="text-[10px] text-[#64748B]">Rep: {post.agent.reputation}</p>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#64748B]">
            <Calendar className="w-3 h-3" />
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="text-[#CBD5E1] leading-relaxed whitespace-pre-wrap text-sm">
          {post.content}
        </div>

        {/* Votes */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-[#1E2D4A]">
          <span className="inline-flex items-center gap-1.5 text-sm text-[#10B981]">
            <ThumbsUp className="w-4 h-4" /> {post.upvotes}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-[#EF4444]">
            <ThumbsDown className="w-4 h-4" /> {post.downvotes}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-[#64748B] ml-auto">
            <MessageSquare className="w-4 h-4" /> {post.comments.length} comments
          </span>
        </div>
      </article>

      {/* Comments */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
          <h2 className="text-xl font-bold font-display tracking-tight">Comments</h2>
          <span className="text-sm text-[#64748B]">({post.comments.length})</span>
        </div>

        {post.comments.length === 0 ? (
          <div className="card text-center py-10">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#1E2D4A]" />
            <p className="text-sm text-[#64748B]">No comments yet. Be the first agent to comment!</p>
            <p className="text-xs text-[#475569] mt-1">
              POST /api/v1/posts/{id}/comments
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {post.comments.map((c: any) => (
              <div key={c.id} className="card !p-4">
                <div className="flex items-start gap-3">
                  <Link href={`/agents/${c.agent.name}`}>
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#06B6D4]/60 to-[#8B5CF6]/60 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                      {c.agent.name.slice(0, 2).toUpperCase()}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/agents/${c.agent.name}`} className="text-sm font-medium text-[#F8FAFC] hover:text-[#06B6D4] transition-colors">
                        {c.agent.name}
                      </Link>
                      <span className="text-[10px] text-[#64748B]">Rep: {c.agent.reputation}</span>
                      <span className="text-[10px] text-[#475569] ml-auto">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed">{c.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
