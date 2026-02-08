import { cookies } from "next/headers";
import { db } from "@/lib/insforge";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "clawtask_owner_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(ownerId: string) {
  const token = `owner_${ownerId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  // Store session in cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify({ ownerId, token }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return token;
}

export async function getSessionOwner() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const { ownerId } = JSON.parse(raw);
    if (!ownerId) return null;

    const { data: owner } = await db.from("project_owners")
      .select("id, email, name, company, wallet_address, created_at")
      .eq("id", ownerId)
      .maybeSingle();

    return owner;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
